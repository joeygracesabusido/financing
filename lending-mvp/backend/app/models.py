from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from decimal import Decimal

# Helper for handling MongoDB's ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    hashed_password: str
    full_name: str
    role: str = "borrower" # 'borrower' or 'admin' 
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Loan(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    borrower_id: PyObjectId
    amount_requested: Decimal
    amount_disbursed: Optional[Decimal]
    term_months: int
    interest_rate: Decimal # Annual rate
    status: str = "pending" # pending, approved, active, paid, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LedgerEntry(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    transaction_id: str # Unique ID for the balanced transaction
    account: str # e.g., "Cash", "Loans Receivable"
    amount: Decimal
    entry_type: str # 'debit' or 'credit'
    timestamp: datetime = Field(default_factory=datetime.utcnow)
