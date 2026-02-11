from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from bson import ObjectId
from decimal import Decimal

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: GetCoreSchemaHandler,
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.no_info_plain_validator_function(cls._validate),
            ]
        )

    @classmethod
    def _validate(cls, value: Any) -> ObjectId:
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls,
        core_schema: core_schema.CoreSchema,
        handler: GetJsonSchemaHandler,
    ) -> Any:
        json_schema = handler(core_schema)
        json_schema.update(type="string", example="507f1f77bcf86cd799439011")
        return json_schema


# --- Loan Models ---
class LoanBase(BaseModel):
    borrower_id: PyObjectId
    amount_requested: Decimal
    term_months: int
    interest_rate: Decimal # Annual rate

class LoanCreate(LoanBase):
    pass

class LoanUpdate(BaseModel):
    borrower_id: Optional[PyObjectId] = None
    amount_requested: Optional[Decimal] = None
    term_months: Optional[int] = None
    interest_rate: Optional[Decimal] = None
    status: Optional[str] = None # pending, approved, active, paid, rejected

class Loan(LoanBase): # This is effectively LoanInDB
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: str = "pending" # pending, approved, active, paid, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) # Added updated_at

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class LoanOut(LoanBase): # For API responses
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
