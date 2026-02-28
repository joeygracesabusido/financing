from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from ..models import PyObjectId

class TransactionBase(BaseModel):
    account_id: PyObjectId
    transaction_type: Literal[
        "deposit", 
        "withdrawal", 
        "interest_posting", 
        "loan_repayment", 
        "fund_transfer_out", 
        "fund_transfer_in"
    ]
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def handle_legacy_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # If 'transaction_type' is missing but 'type' is present, use 'type'
            if 'transaction_type' not in data and 'type' in data:
                data['transaction_type'] = data.pop('type')
            # Handle 'note' vs 'notes'
            if 'notes' not in data and 'note' in data:
                data['notes'] = data.pop('note')
        return data

class TransactionInDB(TransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
