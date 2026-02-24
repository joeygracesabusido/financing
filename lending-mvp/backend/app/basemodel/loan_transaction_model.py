from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict, field_serializer
from ..models import PyObjectId

class LoanTransactionBase(BaseModel):
    loan_id: str = Field(alias="loan_id")
    transaction_type: Literal["disbursement", "repayment", "interest", "fee", "penalty", "insurance"] = Field(alias="transaction_type")
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    transaction_date: datetime = Field(default_factory=datetime.utcnow, alias="transaction_date")
    notes: Optional[str] = None

    # Additional fields from form
    commercial_bank: Optional[str] = Field(None, alias="commercial_bank")
    servicing_branch: Optional[str] = Field(None, alias="servicing_branch")
    region: Optional[str] = Field(None, alias="region")
    borrower_name: Optional[str] = Field(None, alias="borrower_name")
    loan_product_id: Optional[str] = Field(None, alias="loan_product_id")
    reference_number: Optional[str] = Field(None, alias="reference_number")
    debit_account: Optional[str] = Field(None, alias="debit_account")
    credit_account: Optional[str] = Field(None, alias="credit_account")
    disbursement_method: Optional[str] = Field(None, alias="disbursement_method")
    disbursement_status: Optional[str] = Field("pending", alias="disbursement_status") # Literal might be too strict if DB has 'completed'
    cheque_number: Optional[str] = Field(None, alias="cheque_number")
    beneficiary_bank: Optional[str] = Field(None, alias="beneficiary_bank")
    beneficiary_account: Optional[str] = Field(None, alias="beneficiary_account")
    approved_by: Optional[str] = Field(None, alias="approved_by")
    processed_by: Optional[str] = Field(None, alias="processed_by")
    created_by: Optional[str] = Field(None, alias="created_by")
    updated_by: Optional[str] = Field(None, alias="updated_by")

    @field_serializer('amount')
    def serialize_amount(self, value: Decimal):
        return float(value)

class LoanTransaction(LoanTransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updated_at")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str},  # Ensure PyObjectId is serialized as string
        by_alias=True  # Use field aliases for serialization
    )
