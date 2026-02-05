from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field
from ..models import PyObjectId

class TransactionBase(BaseModel):
    account_id: PyObjectId
    transaction_type: Literal["deposit", "withdrawal"]
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class TransactionInDB(TransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
