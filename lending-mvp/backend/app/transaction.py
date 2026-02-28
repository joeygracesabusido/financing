import strawberry
from typing import List, Optional
from strawberry.types import Info
from .database import get_db
from .database.savings_crud import SavingsCRUD
from .database.transaction_crud import TransactionCRUD
from .database.standing_order_crud import StandingOrderCRUD, InterestComputationCRUD
from .basemodel.transaction_model import TransactionBase, TransactionInDB
from .models import UserInDB
from .savings import (
    TransactionType, TransactionsResponse, TransactionCreateInput, TransactionResponse,
    FundTransferInput, FundTransferResponse, StandingOrderInput, StandingOrderResponse,
    StatementData, StatementResponse
)
from decimal import Decimal
from datetime import datetime, timedelta
from bson import ObjectId


from .database.postgres import AsyncSessionLocal
from .utils.savings_accounting_utils import post_savings_transaction_accounting

def map_db_transaction_to_strawberry_type(trans_data: TransactionInDB) -> TransactionType:
    return TransactionType(
        id=strawberry.ID(str(trans_data.id)),
        account_id=strawberry.ID(str(trans_data.account_id)),
        transaction_type=trans_data.transaction_type,
        amount=float(trans_data.amount),
        timestamp=trans_data.timestamp,
        notes=trans_data.notes
    )

@strawberry.type
class TransactionQuery:
    @strawberry.field
    async def getTransactions(self, info: Info, account_id: strawberry.ID) -> TransactionsResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return TransactionsResponse(success=False, message="Not authenticated", transactions=[], total=0)

        db = get_db()
        # Authorization: Ensure the user owns the account they are querying transactions for
        savings_crud = SavingsCRUD(db.savings)
        account = await savings_crud.get_savings_account_by_id(str(account_id))
        # if not account or str(account.user_id) != str(current_user.id): # Corrected to account.user_id
        #     return TransactionsResponse(success=False, message="Not authorized", transactions=[])
            
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        transactions_data = await transaction_crud.get_transactions_by_account_id(str(account_id))

        transactions = [map_db_transaction_to_strawberry_type(t) for t in transactions_data]
        return TransactionsResponse(success=True, message="Transactions retrieved", transactions=transactions, total=len(transactions))

@strawberry.type
class TransactionMutation:
    @staticmethod
    async def _create_transaction(info: Info, input: TransactionCreateInput, trans_type: str) -> TransactionResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return TransactionResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        
        # 1. Fetch account to check type and existence (needed for accounting GL determination)
        account = await savings_crud.get_savings_account_by_id(str(input.account_id))
        if not account:
            return TransactionResponse(success=False, message="Account not found")

        # Authorization check
        # if str(account.user_id) != str(current_user.id):
        #     return TransactionResponse(success=False, message="Not authorized for this account")

        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        
        transaction_to_create = TransactionBase(
            account_id=input.account_id,
            transaction_type=trans_type,
            amount=Decimal(str(input.amount)),
            notes=input.notes
        )

        # 2. Update balance and create transaction record in MongoDB
        created_transaction = await transaction_crud.create_transaction(transaction_to_create)

        if not created_transaction:
            return TransactionResponse(success=False, message=f"Failed to create {trans_type}. Insufficient funds or error.")

        # 3. Double-entry accounting: Post to GL (PostgreSQL)
        try:
            async with AsyncSessionLocal() as pg_session:
                await post_savings_transaction_accounting(
                    session=pg_session,
                    account_type=account.type,
                    transaction_type=trans_type,
                    amount=Decimal(str(input.amount)),
                    reference_no=f"TXN-{str(created_transaction.id).upper()}",
                    created_by=str(current_user.id)
                )
                await pg_session.commit()
        except Exception as e:
            # We log but don't necessarily fail the balance update if accounting fails 
            # (though in a production system, you'd want atomicity between MongoDB and PG)
            print(f"Accounting error: {e}")

        transaction = map_db_transaction_to_strawberry_type(created_transaction)
        
        return TransactionResponse(success=True, message=f"{trans_type.capitalize()} successful", transaction=transaction)

    @strawberry.field
    async def createDeposit(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await TransactionMutation._create_transaction(info, input, "deposit")

    @strawberry.field
    async def createWithdrawal(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await TransactionMutation._create_transaction(info, input, "withdrawal")

    @strawberry.field
    async def createFundTransfer(self, info: Info, input: FundTransferInput) -> FundTransferResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return FundTransferResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)

        from_account = await savings_crud.get_savings_account_by_id(str(input.from_account_id))
        if not from_account:
            return FundTransferResponse(success=False, message="Source account not found")

        if from_account.balance < input.amount:
            return FundTransferResponse(success=False, message="Insufficient funds")

        to_account = await savings_crud.get_savings_account_by_id(str(input.to_account_id))
        if not to_account:
            return FundTransferResponse(success=False, message="Destination account not found")

        await savings_crud.update_balance(str(input.from_account_id), -Decimal(str(input.amount)))
        await savings_crud.update_balance(str(input.to_account_id), Decimal(str(input.amount)))

        debit_trans = TransactionBase(
            account_id=str(input.from_account_id),
            transaction_type="transfer_out",
            amount=input.amount,
            notes=f"Transfer to {to_account.account_number}"
        )
        credit_trans = TransactionBase(
            account_id=str(input.to_account_id),
            transaction_type="transfer_in",
            amount=input.amount,
            notes=f"Transfer from {from_account.account_number}"
        )

        await transaction_crud.create_transaction(debit_trans)
        await transaction_crud.create_transaction(credit_trans)

        return FundTransferResponse(success=True, message="Transfer successful")

    @strawberry.field
    async def createStandingOrder(self, info: Info, input: StandingOrderInput) -> StandingOrderResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return StandingOrderResponse(success=False, message="Not authenticated")

        db = get_db()
        standing_order_crud = StandingOrderCRUD(db.standing_orders)

        order_data = {
            "source_account_id": str(input.source_account_id),
            "destination_account_id": str(input.destination_account_id),
            "amount": input.amount,
            "frequency": input.frequency,
            "start_date": input.start_date,
            "end_date": input.end_date,
            "is_active": input.is_active,
            "created_at": datetime.utcnow()
        }

        order_id = await standing_order_crud.create_standing_order(order_data)
        return StandingOrderResponse(success=True, message="Standing order created", standing_order_id=order_id)

    @strawberry.field
    async def cancelStandingOrder(self, info: Info, standing_order_id: strawberry.ID) -> StandingOrderResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return StandingOrderResponse(success=False, message="Not authenticated")

        db = get_db()
        standing_order_crud = StandingOrderCRUD(db.standing_orders)

        success = await standing_order_crud.update_standing_order(str(standing_order_id), {"is_active": False})
        if not success:
            return StandingOrderResponse(success=False, message="Failed to cancel standing order")

        return StandingOrderResponse(success=True, message="Standing order cancelled")

    @strawberry.field
    async def generateStatement(self, info: Info, account_id: strawberry.ID, start_date: datetime, end_date: datetime) -> StatementResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return StatementResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)

        account = await savings_crud.get_savings_account_by_id(str(account_id))
        if not account:
            return StatementResponse(success=False, message="Account not found")

        transactions = await transaction_crud.get_transactions_by_account_id(str(account_id))

        opening_balance = account.balance
        total_deposits = 0.0
        total_withdrawals = 0.0

        for trans in transactions:
            if trans.timestamp >= start_date and trans.timestamp <= end_date:
                if trans.transaction_type == "deposit" or trans.transaction_type == "transfer_in":
                    total_deposits += float(trans.amount)
                elif trans.transaction_type == "withdrawal" or trans.transaction_type == "transfer_out":
                    total_withdrawals += float(trans.amount)

        opening_balance_calc = opening_balance - total_deposits + total_withdrawals

        period_transactions = [
            map_db_transaction_to_strawberry_type(t)
            for t in transactions
            if start_date <= t.timestamp <= end_date
        ]

        statement = StatementData(
            account_number=account.account_number,
            period_start=start_date,
            period_end=end_date,
            opening_balance=opening_balance_calc,
            closing_balance=account.balance,
            total_deposits=total_deposits,
            total_withdrawals=total_withdrawals,
            total_credits=total_deposits,
            total_debits=total_withdrawals,
            transactions=period_transactions
        )

        return StatementResponse(success=True, message="Statement generated", statement=statement)

    @strawberry.field
    async def postInterest(self, info: Info, account_id: strawberry.ID) -> TransactionResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return TransactionResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        interest_crud = InterestComputationCRUD(db.interest_ledger)

        account = await savings_crud.get_savings_account_by_id(str(account_id))
        if not account:
            return TransactionResponse(success=False, message="Account not found")

        rate = Decimal(str(account.interest_rate)) if hasattr(account, 'interest_rate') and account.interest_rate else Decimal("0.025")
        daily_interest = await interest_crud.compute_daily_interest(str(account_id), Decimal(str(account.balance)), rate)

        wht_rate = Decimal("0.20")
        await interest_crud.post_interest(str(account_id), daily_interest, wht_rate)

        return TransactionResponse(success=True, message=f"Interest posted: {daily_interest}")
