from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict, field_serializer
from ..models import PyObjectId

class LoanTransactionBase(BaseModel):
    loan_id: str = Field(alias="loanId")
    transaction_type: Literal["disbursement", "repayment", "interest", "fee", "penalty", "insurance"] = Field(alias="transactionType")
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    transaction_date: datetime = Field(default_factory=datetime.utcnow, alias="transactionDate")
    notes: Optional[str] = None

    # Additional fields from form
    commercial_bank: Optional[str] = Field(None, alias="commercialBank")
    servicing_branch: Optional[str] = Field(None, alias="servicingBranch")
    region: Optional[str] = Field(None, alias="region")
    borrower_name: Optional[str] = Field(None, alias="borrowerName")
    loan_product: Optional[str] = Field(None, alias="loanProduct")
    reference_number: Optional[str] = Field(None, alias="referenceNumber")
    debit_account: Optional[str] = Field(None, alias="debitAccount")
    credit_account: Optional[str] = Field(None, alias="creditAccount")
    disbursement_method: Optional[str] = Field(None, alias="disbursementMethod")
    disbursement_status: Optional[str] = Field("pending", alias="disbursementStatus")
    cheque_number: Optional[str] = Field(None, alias="chequeNumber")
    beneficiary_bank: Optional[str] = Field(None, alias="beneficiaryBank")
    beneficiary_account: Optional[str] = Field(None, alias="beneficiaryAccount")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    processed_by: Optional[str] = Field(None, alias="processedBy")

    @field_serializer('amount')
    def serialize_amount(self, value: Decimal):
        return float(value)

class LoanTransaction(LoanTransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str},  # Ensure PyObjectId is serialized as string
        by_alias=True  # Use field aliases for serialization
    )
