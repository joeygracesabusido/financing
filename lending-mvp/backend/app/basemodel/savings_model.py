# models.py  (or schemas.py)
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from ..models import PyObjectId
from bson import ObjectId # Added import for ObjectId


class SavingsAccountBase(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    account_number: str = Field(..., min_length=8)
    user_id: PyObjectId
    type: str
    balance: Decimal = Field(default=Decimal("0.00"))
    currency: str = "PHP"
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["active", "frozen", "closed"] = "active"
    customer_info: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, Decimal: str}
    )


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


class ShareCapitalAccount(SavingsAccountBase):
    type: Literal["share_capital"] = "share_capital"
    minimum_share: Decimal = Decimal("100.00")
    share_value: Decimal = Decimal("100.00")
    total_shares: int = 0
    membership_date: datetime


class GoalSavings(SavingsAccountBase):
    type: Literal["goal_savings"] = "goal_savings"
    target_amount: Decimal
    target_date: datetime
    goal_name: str
    current_savings: Decimal = Decimal("0.00")
    interest_rate: Decimal = Decimal("1.50")
    auto_deposit_amount: Optional[Decimal] = None
    auto_deposit_frequency: Optional[str] = None

    @field_validator("target_date")
    @classmethod
    def validate_future_target(cls, v: datetime):
        if v <= datetime.utcnow():
            raise ValueError("Target date must be in future")
        return v


class MinorSavingsAccount(SavingsAccountBase):
    type: Literal["minor_savings"] = "minor_savings"
    guardian_id: PyObjectId
    guardian_name: str
    minor_date_of_birth: datetime
    allowed_withdrawal_age: int = 18
    interest_rate: Decimal = Decimal("0.50")
    max_withdrawal_amount: Decimal = Decimal("10000.00")
    requires_guardian_consent: bool = True


class JointAccount(SavingsAccountBase):
    type: Literal["joint_account"] = "joint_account"
    primary_owner_id: PyObjectId
    secondary_owner_id: PyObjectId
    secondary_owner_name: str
    operation_mode: Literal["AND", "OR", "EITHER"] = "EITHER"
    interest_rate: Decimal = Decimal("0.25")


class InterestRateTier(BaseModel):
    min_balance: Decimal
    max_balance: Decimal
    rate: Decimal


class SavingsAccountWithInterest(SavingsAccountBase):
    interest_rate: Decimal = Decimal("0.00")
    interest_rate_tiers: Optional[List[InterestRateTier]] = None
    withholding_tax_rate: Decimal = Decimal("0.20")
    last_interest_posted_date: Optional[datetime] = None
    accumulated_interest: Decimal = Decimal("0.00")


