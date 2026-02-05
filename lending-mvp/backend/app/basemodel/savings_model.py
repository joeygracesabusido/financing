# models.py  (or schemas.py)
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from ..models import PyObjectId


class SavingsAccountBase(BaseModel):
    account_number: str = Field(..., min_length=8)
    user_id: PyObjectId
    type: str
    balance: Decimal = Field(default=Decimal("0.00"))
    currency: str = "PHP"
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["active", "frozen", "closed"] = "active"


class RegularSavings(SavingsAccountBase):
    type: Literal["regular"] = "regular"
    min_balance: Decimal = Decimal("500.00")
    interest_rate: Decimal = Decimal("0.25")


class HighYieldSavings(SavingsAccountBase):
    type: Literal["high_yield"] = "high_yield"
    interest_rate: Decimal = Decimal("4.00")
    interest_paid_frequency: Literal["daily", "monthly", "quarterly"] = "monthly"
    tiers: Optional[List[Dict[str, Decimal]]] = None


class TimeDeposit(SavingsAccountBase):
    type: Literal["time_deposit"] = "time_deposit"
    principal: Decimal
    term_days: int
    maturity_date: datetime
    interest_rate: Decimal
    early_withdrawal_penalty_pct: Decimal = Decimal("1.00")
    auto_renew: bool = False

    @field_validator("maturity_date")
    @classmethod
    def validate_future(cls, v: datetime):
        if v <= datetime.utcnow():
            raise ValueError("Maturity must be in future")
        return v


