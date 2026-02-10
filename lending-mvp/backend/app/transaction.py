import strawberry
from typing import List, Optional
from strawberry.types import Info
from .database import get_db
from .database.savings_crud import SavingsCRUD
from .database.transaction_crud import TransactionCRUD
from .basemodel.transaction_model import TransactionBase, TransactionInDB # Added TransactionInDB
from .models import UserInDB
from .savings import TransactionType, TransactionsResponse, TransactionCreateInput, TransactionResponse

from decimal import Decimal
from datetime import datetime







def map_db_transaction_to_strawberry_type(trans_data: TransactionInDB) -> TransactionType:
    """Maps a TransactionInDB object from the DB to a TransactionType."""
    return TransactionType(
        id=strawberry.ID(str(trans_data.id)),
        account_id=strawberry.ID(str(trans_data.account_id)),
        transaction_type=trans_data.transaction_type,
        amount=trans_data.amount,
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
        
        # Authorization check
        # account = await savings_crud.get_savings_account_by_id(str(input.account_id))
        # if not account or str(account.user_id) != str(current_user.id): # Corrected to account.user_id
        #     return TransactionResponse(success=False, message="Not authorized for this account")

        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        
        transaction_to_create = TransactionBase(
            account_id=input.account_id,
            transaction_type=trans_type,
            amount=input.amount,
            notes=input.notes
        )

        created_transaction = await transaction_crud.create_transaction(transaction_to_create)

        if not created_transaction:
            return TransactionResponse(success=False, message=f"Failed to create {trans_type}. Insufficient funds or error.")

        transaction = map_db_transaction_to_strawberry_type(created_transaction)
        
        return TransactionResponse(success=True, message=f"{trans_type.capitalize()} successful", transaction=transaction)

    @strawberry.field
    async def createDeposit(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await TransactionMutation._create_transaction(info, input, "deposit")

    @strawberry.field
    async def createWithdrawal(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await TransactionMutation._create_transaction(info, input, "withdrawal")
