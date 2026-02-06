import strawberry
from typing import List, Optional
from strawberry.types import Info
from .database import get_db
from .database.savings_crud import SavingsCRUD
from .basemodel.savings_model import RegularSavings, HighYieldSavings, TimeDeposit, SavingsAccountBase
from .models import UserInDB
from .schema import SavingsAccountType, SavingsAccountCreateInput, SavingsAccountResponse, SavingsAccountsResponse
from decimal import Decimal
from datetime import datetime, timedelta



def map_db_account_to_strawberry_type(account_data: SavingsAccountBase) -> SavingsAccountType:
    """Maps a SavingsAccountBase object to a SavingsAccountType."""
    return SavingsAccountType(
        id=strawberry.ID(str(account_data.id)),
        account_number=account_data.account_number,
        user_id=strawberry.ID(str(account_data.user_id)),
        type=account_data.type,
        balance=account_data.balance,
        currency=account_data.currency,
        opened_at=account_data.opened_at,
        status=account_data.status,
        created_at=account_data.created_at,
        updated_at=account_data.updated_at
    )

@strawberry.type
class SavingsQuery:
    @strawberry.field
    async def savingsAccount(self, info: Info, account_id: strawberry.ID) -> SavingsAccountResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return SavingsAccountResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        account_data = await savings_crud.get_savings_account_by_id(str(account_id))

        if not account_data:
            return SavingsAccountResponse(success=False, message="Account not found")

        # Basic authorization: check if the account belongs to the current user
        if str(account_data.user_id) != str(current_user.id):
            return SavingsAccountResponse(success=False, message="Not authorized to view this account")
            
        account = map_db_account_to_strawberry_type(account_data)
        return SavingsAccountResponse(success=True, message="Account retrieved", account=account)

    @strawberry.field
    async def savingsAccounts(self, info: Info) -> SavingsAccountsResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return SavingsAccountsResponse(success=False, message="Not authenticated", accounts=[], total=0)

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        accounts_data = await savings_crud.get_all_savings_accounts() # Fetch all accounts
        
        accounts = [map_db_account_to_strawberry_type(acc) for acc in accounts_data]
        return SavingsAccountsResponse(success=True, message="Accounts retrieved", accounts=accounts, total=len(accounts))

@strawberry.type
class SavingsMutation:
    @strawberry.field
    async def createSavingsAccount(self, info: Info, input: SavingsAccountCreateInput) -> SavingsAccountResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return SavingsAccountResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)

        # Logic to create the correct type of account based on input
        account_data = {
            "account_number": input.account_number,
            "user_id": str(input.customer_id),
            "balance": input.balance,
            "opened_at": input.opened_at,
            "currency": input.currency,
            "status": input.status,
            "type": input.type
        }

        if input.type == "regular":
            account_to_create = RegularSavings(**account_data)
        elif input.type == "high_yield":
            if input.interest_rate is not None:
                account_data["interest_rate"] = input.interest_rate
            if input.interest_paid_frequency is not None:
                account_data["interest_paid_frequency"] = input.interest_paid_frequency
            account_to_create = HighYieldSavings(**account_data)
        elif input.type == "time_deposit":
            if input.principal is not None:
                account_data["principal"] = input.principal
            if input.term_days is not None:
                account_data["term_days"] = input.term_days
                # Calculate maturity_date
                account_data["maturity_date"] = input.opened_at + timedelta(days=input.term_days)
            if input.interest_rate is not None:
                account_data["interest_rate"] = input.interest_rate
            account_to_create = TimeDeposit(**account_data)
        else:
            return SavingsAccountResponse(success=False, message=f"Invalid account type: {input.type}")
        
        created_account = await savings_crud.create_savings_account(account_to_create)
        
        # We need to get the full dict from the DB to map it
        created_account_data = await savings_crud.get_savings_account_by_id(str(created_account.id))

        account = map_db_account_to_strawberry_type(created_account_data)

        return SavingsAccountResponse(success=True, message="Savings account created", account=account)
