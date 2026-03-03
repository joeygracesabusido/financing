"""
Pydantic models for the application.
Uses PostgreSQL-compatible UUID/serial IDs instead of MongoDB's ObjectId.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID, uuid4


# --- Helper function for UUID generation ---
def generate_uuid() -> UUID:
    """Generate a new UUID4."""
    return uuid4()


# --- User Models ---
class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    role: str
    branch_id: Optional[int] = None
    branch_code: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def check_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    branch_id: Optional[int] = None
    branch_code: Optional[str] = None


class UserInDB(UserBase):
    id: UUID = Field(default_factory=generate_uuid, alias="_id")
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    branch_id: Optional[int] = None
    branch_code: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={UUID: str}
    )


class User(UserBase):
    id: UUID = Field(default_factory=generate_uuid)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Customer Models ---
class CustomerBase(BaseModel):
    customer_type: str
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    display_name: str
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
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    customer_type: Optional[str] = None
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    display_name: Optional[str] = None
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
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str


class CustomerInDB(CustomerBase):
    id: int = Field(default_factory=lambda: 0, alias="id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
    )


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Ledger Entry Models ---
class LedgerEntry(BaseModel):
    id: int = Field(default_factory=lambda: 0, alias="id")
    transaction_id: str
    account: str
    amount: Decimal
    entry_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
    )


# --- Loan Models ---
class LoanBase(BaseModel):
    loan_id: str
    customer_id: int
    product_id: int
    principal: Decimal
    interest_rate: Decimal
    term_months: int
    status: str = "pending"


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    status: Optional[str] = None
    principal: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    term_months: Optional[int] = None
    disbursement_date: Optional[datetime] = None


class LoanInDB(LoanBase):
    id: int = Field(default_factory=lambda: 0, alias="id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
    )


class Loan(LoanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Savings Models ---
class SavingsBase(BaseModel):
    account_number: str
    display_name: str
    customer_id: int
    account_type: str
    primary_owner_id: int
    secondary_owner_id: Optional[int] = None
    current_balance: Decimal = 0.0
    minimum_balance: Decimal = 1000.0
    interest_rate: Decimal = 0.5
    is_active: bool = True
    status: str = "active"


class SavingsCreate(SavingsBase):
    pass


class SavingsUpdate(BaseModel):
    current_balance: Optional[Decimal] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None


class SavingsInDB(SavingsBase):
    id: int = Field(default_factory=lambda: 0, alias="id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
    )


class SavingsAccount(SavingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Transaction Models ---
class TransactionBase(BaseModel):
    transaction_id: str
    transaction_type: str
    account_id: Optional[int] = None
    amount: Decimal
    balance_after: Optional[Decimal] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    status: str = "completed"


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None


class TransactionInDB(TransactionBase):
    id: int = Field(default_factory=lambda: 0, alias="id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
    )


class Transaction(TransactionBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)