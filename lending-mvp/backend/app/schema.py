import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, date
from strawberry.types import Info

#from .database import get_db
# from .database.customer_crud import CustomerCRUD
# from .customer import CustomerType, convert_customer_db_to_customer_type
from .models import CustomerInDB # Needed for convert_customer_db_to_customer_type, if it's moved here or passed around

from .services import accounting_service, loan_service
from .models import Customer, CustomerCreate, CustomerUpdate


# --- Strawberry Types (mirroring Pydantic models) ---

# User Types
@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime

@strawberry.input
class UserCreateInput:
    email: str
    username: str
    full_name: str
    password: str
    role: Optional[str] = "user"

@strawberry.input
class UserUpdateInput:
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None

@strawberry.input
class LoginInput:
    username: str # Can be email or username
    password: str

@strawberry.type
class LoginResponse:
    access_token: str
    token_type: str
    user: UserType

@strawberry.type
class UserResponse:
    success: bool
    message: str
    user: Optional[UserType] = None

@strawberry.type
class LogoutResponse:
    success: bool
    message: str

@strawberry.type
class UsersResponse:
    success: bool
    message: str
    users: List[UserType]
    total: int

# # Savings Types
# @strawberry.type
# class SavingsAccountType:
#     id: strawberry.ID
#     account_number: str
#     user_id: strawberry.ID
#     type: str
#     balance: float
#     currency: str
#     opened_at: datetime
#     created_at: datetime
#     updated_at: datetime
#     status: str
#     customer: Optional["CustomerType"] = None

#     @strawberry.field
#     async def customer(self, info: Info) -> Optional[CustomerType]:
#         db = get_db()
#         customer_crud = CustomerCRUD(db.customers)
        
#         customer_data = await customer_crud.get_customer_by_id(str(self.user_id))
        
#         if customer_data:
#             return convert_customer_db_to_customer_type(customer_data)
#         return None

 

# @strawberry.input
# class SavingsAccountCreateInput:
#     customer_id: strawberry.ID # Customer ID to link the account
#     account_number: str
#     type: str # e.g., "basic", "interest-bearing", "fixed-deposit"
#     balance: float = 0.00 # Initial deposit
#     currency: str = "PHP"
#     status: str = "active"
#     opened_at: datetime # Date the account was opened
#     interest_rate: Optional[float] = None # For HighYieldSavings and TimeDeposit
#     interest_paid_frequency: Optional[str] = None # For HighYieldSavings
#     principal: Optional[float] = None # For TimeDeposit
#     term_days: Optional[int] = None # For TimeDeposit

# @strawberry.type
# class SavingsAccountResponse:
#     success: bool
#     message: str
#     account: Optional[SavingsAccountType] = None

# @strawberry.type
# class SavingsAccountsResponse:
#     success: bool
#     message: str
#     accounts: List[SavingsAccountType]
#     total: int

# # Transaction Types
# @strawberry.type
# class TransactionType:
#     id: strawberry.ID
#     account_id: strawberry.ID
#     transaction_type: str # e.g., "deposit", "withdrawal"
#     amount: float
#     timestamp: datetime
#     notes: Optional[str] = None

# @strawberry.input
# class TransactionCreateInput:
#     account_id: strawberry.ID
#     amount: float
#     notes: Optional[str] = None

# @strawberry.type
# class TransactionResponse:
#     success: bool
#     message: str
#     transaction: Optional[TransactionType] = None

# @strawberry.type
# class TransactionsResponse:
#     success: bool
#     message: str
#     transactions: List[TransactionType]
#     total: int

# Loan Types
@strawberry.type
class LoanType:
    borrower_id: str
    amount_requested: Decimal
    status: str

# Ledger Entry Types
@strawberry.type
class LedgerEntryType:
    transaction_id: str
    account: str
    amount: float
    entry_type: str
    timestamp: str

# --- GraphQL Queries ---

@strawberry.type
class Query:
    @strawberry.field
    async def get_loan_by_id(self, loan_id: str) -> Optional[LoanType]:
        # Placeholder for fetching loan
        # In a real app, you'd call a service function
        return LoanType(borrower_id="some_user", amount_requested=Decimal("1000"), status="pending")

    @strawberry.field
    async def get_borrower_ledger(self, borrower_id: str) -> List[LedgerEntryType]:
        # This is where GraphQL shines: complex, nested queries
        entries = await accounting_service.get_ledger_for_borrower(borrower_id)
        return [
            LedgerEntryType(
                transaction_id=e["transaction_id"],
                account=e["account"],
                amount=e["amount"],
                entry_type=e["entry_type"],
                timestamp=str(e["timestamp"])
            ) for e in entries
        ]

    # These fields are typically defined in their respective modules and then composed in main.py
    # @strawberry.field
    # async def savingsAccount(self, info: Info, account_id: strawberry.ID) -> SavingsAccountResponse:
    #     from .savings import SavingsQuery
    #     return await SavingsQuery().savingsAccount(info, account_id)

    # @strawberry.field
    # async def savingsAccounts(self, info: Info) -> SavingsAccountsResponse:
    #     from .savings import SavingsQuery
    #     return await SavingsQuery().savingsAccounts(info)

# --- GraphQL Mutations ---

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def disburse_loan(self, loan_id: str) -> str:
        # Business logic should be a service layer
        success = await loan_service.disburse_loan(loan_id)
        return "Disbursement successful" if success else "Disbursement failed"
    
    # These fields are typically defined in their respective modules and then composed in main.py
    # @strawberry.mutation
    # async def createSavingsAccount(self, info: Info, input: SavingsAccountCreateInput) -> SavingsAccountResponse:
    #     from .savings import SavingsMutation
    #     return await SavingsMutation().createSavingsAccount(info, input)