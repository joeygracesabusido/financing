from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId
from decimal import Decimal

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import core_schema

# Reusing PyObjectId definition from models.py for consistency
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

class LoanProductBase(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=10)
    product_name: str = Field(..., min_length=1, max_length=100)
    term_type: str = Field(..., min_length=1, max_length=50) # e.g., Short Term, Long Term
    gl_code: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., min_length=1, max_length=50) # e.g., SME, Housing, CPL, AGRI
    default_interest_rate: float= Field(None, ge=0)
    template: str = Field(..., min_length=1, max_length=50)
    security: str = Field(..., min_length=1, max_length=50) # e.g., Secured, Unsecured
    br_lc: str = Field(..., min_length=1, max_length=50) # e.g., Branch, Lending

class LoanProductCreate(LoanProductBase):
    pass

class LoanProductUpdate(BaseModel):
    product_code: Optional[str] = Field(None, min_length=1, max_length=10)
    product_name: Optional[str] = Field(None, min_length=1, max_length=100)
    term_type: Optional[str] = Field(None, min_length=1, max_length=50)
    gl_code: Optional[str] = Field(None, min_length=1, max_length=50)
    type: Optional[str] = Field(None, min_length=1, max_length=50)
    default_interest_rate: float = Field(None, ge=0) # Interest rate cannot be negative
    template: Optional[str] = Field(None, min_length=1, max_length=50)
    security: Optional[str] = Field(None, min_length=1, max_length=50)
    br_lc: Optional[str] = Field(None, min_length=1, max_length=50)

class LoanProduct(LoanProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class LoanProductOut(LoanProductBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
