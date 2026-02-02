import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from .services import accounting_service, loan_service
from .models import Customer, CustomerCreate, CustomerUpdate


# --- Strawberry Types (mirroring Pydantic models) ---

# User Types
@strawberry.type
class UserType:
    id: str
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
class UsersResponse:
    success: bool
    message: str
    users: List[UserType]
    total: int

# Customer Types
@strawberry.type
class CustomerType:
    id: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: str
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None
    created_at: datetime
    updated_at: datetime

@strawberry.input
class CustomerCreateInput:
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: str
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None

@strawberry.input
class CustomerUpdateInput:
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: Optional[str] = None
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None

@strawberry.type
class CustomerResponse:
    success: bool
    message: str
    customer: Optional[CustomerType] = None

@strawberry.type
class CustomersResponse:
    success: bool
    message: str
    customers: List[CustomerType]
    total: int

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

# --- GraphQL Mutations ---

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def disburse_loan(self, loan_id: str) -> str:
        # Business logic should be a service layer
        success = await loan_service.disburse_loan(loan_id)
        return "Disbursement successful" if success else "Disbursement failed"