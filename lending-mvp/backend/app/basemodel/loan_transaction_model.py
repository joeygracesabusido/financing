from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict
from ..models import PyObjectId

class LoanTransactionBase(BaseModel):
    loan_id: PyObjectId
    transaction_type: Literal["disbursement", "repayment", "interest", "fee", "penalty", "insurance"]
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

    # Additional fields from form
    commercial_bank: Optional[str] = None
    servicing_branch: Optional[str] = None
    region: Optional[str] = None
    borrower_name: Optional[str] = None
    loan_product: Optional[str] = None
    reference_number: Optional[str] = None
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    disbursement_method: Optional[str] = None
    disbursement_status: Optional[str] = "pending"
    cheque_number: Optional[str] = None
    beneficiary_bank: Optional[str] = None
    beneficiary_account: Optional[str] = None
    approved_by: Optional[str] = None
    processed_by: Optional[str] = None

class LoanTransaction(LoanTransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str} # Ensure PyObjectId is serialized as string
    )
