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

# Import RBAC helpers for branch and role-based access control
from .auth.rbac import (
    get_sql_branch_filter,
    require_management_role,
    BRANCH_SCOPED_ROLES,
    assert_branch_access,
    assert_own_branch_teller,
    get_user_branch_code,
    CROSS_BRANCH_ROLES
)

# Audit logging utilities
import logging
logger = logging.getLogger(__name__)

def _audit_log(user_id: str, action: str, details: str, success: bool):
    """Log audit trail for security-critical operations."""
    try:
        from datetime import datetime as dt
        log_entry = {
            'timestamp': dt.utcnow().isoformat(),
            'user_id': user_id,
            'action': action,
            'details': details,
            'success': success
        }
        logger.error(f"AUDIT_LOG:{user_id}|{action}|{details}|{success}")
    except Exception as e:
        print(f"Audit logging failed: {e}")


class Query:
    @strawberry.field
    async def get_transactions(self, info: Info, account_id: str) -> TransactionsResponse:
        current_user = info.context.get("current_user")
        if not current_user:
            return TransactionsResponse(success=False, message="Not authenticated", transactions=[], total=0)

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        account = await savings_crud.get_savings_account_by_id(account_id)
        if not account:
            return TransactionsResponse(success=False, message="Account not found", transactions=[], total=0)

        branch_filter = get_sql_branch_filter(current_user)
        if branch_filter:
            from .database.customer_crud import CustomerCRUD
            customer_crud = CustomerCRUD(db.customers)
            customer = await customer_crud.get_customer_by_id(str(account.user_id))
            
            if customer and customer.branch != branch_filter:
                _audit_log(
                    user_id=str(current_user.id),
                    action="transaction_access_denied",
                    details=f"Attempted to access account {account.account_number} from branch {customer.branch}, user is from branch {branch_filter}",
                    success=False
                )
                return TransactionsResponse(
                    success=False, 
                    message=f"Access denied: Account belongs to branch {customer.branch}, you are from branch {branch_filter}",
                    transactions=[],
                    total=0
                )
            elif current_user.role in BRANCH_SCOPED_ROLES and str(account.user_id) != str(current_user.id):
                _audit_log(
                    user_id=str(current_user.id),
                    action="transaction_access_denied",
                    details=f"Attempted to access customer account {account.account_number}, cross-branch customer access denied",
                    success=False
                )
                return TransactionsResponse(
                    success=False, 
                    message="Access denied: Staff members can only view transactions for their own branch customers",
                    transactions=[],
                    total=0
                )

        if str(account.user_id) != str(current_user.id):
            if current_user.role not in ("admin", "customer"):
                _audit_log(
                    user_id=str(current_user.id),
                    action="transaction_access_denied",
                    details=f"Attempted to access customer account {account.account_number}, non-admin staff denied cross-customer access",
                    success=False
                )
                return TransactionsResponse(
                    success=False, 
                    message="Access denied: Only admin can access other customers' transactions",
                    transactions=[],
                    total=0
                )

        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        transactions_data = await transaction_crud.get_transactions_by_account_id(account_id)
        transactions = [map_db_transaction_to_strawberry_type(t) for t in transactions_data]
        return TransactionsResponse(success=True, message="Transactions retrieved", transactions=transactions, total=len(transactions))


@strawberry.type
class TransactionQuery:
    @strawberry.field
    async def getTransactions(self, info: Info, account_id: strawberry.ID) -> TransactionsResponse:
        return Query.get_transactions(info, str(account_id))


class Mutation:
    @staticmethod
    async def _create_transaction(info: Info, input: TransactionCreateInput, trans_type: str) -> TransactionResponse:
        current_user = info.context.get("current_user")
        if not current_user:
            return TransactionResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        
        account = await savings_crud.get_savings_account_by_id(str(input.account_id))
        if not account:
            return TransactionResponse(success=False, message="Account not found")

        # Authorization check with branch enforcement
        if str(account.user_id) != str(current_user.id):
            if current_user.role not in ("admin", "customer"):
                _audit_log(
                    user_id=str(current_user.id),
                    action="transaction_create_denied",
                    details=f"Attempted to create {trans_type} on account {account.account_number}, non-admin denied cross-customer access",
                    success=False
                )
                return TransactionResponse(success=False, message="Access denied: Only admin can transact on other customers' accounts")
            
            # Admin accessing other branches - apply branch filter
            branch_filter = get_sql_branch_filter(current_user)
            if branch_filter:
                from .database.customer_crud import CustomerCRUD
                customer_crud = CustomerCRUD(db.customers)
                customer = await customer_crud.get_customer_by_id(str(account.user_id))
                if customer and customer.branch != branch_filter:
                    _audit_log(
                        user_id=str(current_user.id),
                        action="transaction_create_denied",
                        details=f"Attempted to create {trans_type} on account from branch {customer.branch}, admin branch restricted",
                        success=False
                    )
                    return TransactionResponse(
                        success=False, 
                        message=f"Access denied: Account belongs to branch {customer.branch}",
                    )

        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        transaction_to_create = TransactionBase(
            account_id=input.account_id,
            transaction_type=trans_type,
            amount=Decimal(str(input.amount)),
            notes=input.notes
        )
        created_transaction = await transaction_crud.create_transaction(transaction_to_create)

        if not created_transaction:
            return TransactionResponse(success=False, message=f"Failed to create {trans_type}. Insufficient funds or error.")

        try:
            import sys
            # Import at runtime to avoid circular dependencies and LSP errors
            postgres_module = __import__('.database.postgres', fromlist=['AsyncSessionLocal'])
            AsyncSessionLocal = postgres_module.AsyncSessionLocal
            async with AsyncSessionLocal() as pg_session:
                from .utils.savings_accounting_utils import post_savings_transaction_accounting
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
            print(f"Accounting error: {e}")

        transaction = map_db_transaction_to_strawberry_type(created_transaction)
        return TransactionResponse(success=True, message=f"{trans_type.capitalize()} successful", transaction=transaction)

    @staticmethod
    async def create_deposit(info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await Mutation._create_transaction(info, input, "deposit")

    @staticmethod
    async def create_withdrawal(info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await Mutation._create_transaction(info, input, "withdrawal")

    @staticmethod
    async def create_fund_transfer(info: Info, input: FundTransferInput) -> FundTransferResponse:
        current_user = info.context.get("current_user")
        if not current_user:
            return FundTransferResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)

        from_account = await savings_crud.get_savings_account_by_id(str(input.from_account_id))
        if not from_account:
            return FundTransferResponse(success=False, message="Source account not found")

        # Authorization: User can only transfer from their own account (admin exception)
        if str(from_account.user_id) != str(current_user.id):
            if current_user.role not in ("admin", "customer"):
                _audit_log(
                    user_id=str(current_user.id),
                    action="fund_transfer_denied",
                    details=f"Attempted to transfer from account {from_account.account_number}, non-admin denied cross-customer access",
                    success=False
                )
                return FundTransferResponse(success=False, message="Not authorized to transfer from this account")

        if from_account.balance < input.amount:
            return FundTransferResponse(success=False, message="Insufficient funds")

        to_account = await savings_crud.get_savings_account_by_id(str(input.to_account_id))
        if not to_account:
            return FundTransferResponse(success=False, message="Destination account not found")

        # Branch validation for staff roles (admin can bypass)
        if current_user.role not in ("admin", "customer"):
            branch_filter = get_sql_branch_filter(current_user)
            if branch_filter:
                from .database.customer_crud import CustomerCRUD
                customer_crud = CustomerCRUD(db.customers)
                from_customer = await customer_crud.get_customer_by_id(str(from_account.user_id))
                if from_customer and from_customer.branch != branch_filter:
                    _audit_log(
                        user_id=str(current_user.id),
                        action="fund_transfer_denied",
                        details=f"Attempted fund transfer to cross-branch account, staff branch restricted",
                        success=False
                    )
                    return FundTransferResponse(success=False, message=f"Access denied: Source account belongs to branch {from_customer.branch}")

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