from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from bson import ObjectId
from decimal import Decimal

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import core_schema




# Helper for handling MongoDB's ObjectId
# class PyObjectId(ObjectId):
#     @classmethod
#     def __get_validators__(cls):
#         yield cls.validate
#     @classmethod
#     def validate(cls, v):
#         if not ObjectId.is_valid(v):
#             raise ValueError("Invalid ObjectId")
#         return ObjectId(v)
#     @classmethod
#     def __get_pydantic_json_schema__(cls, field_schema):
#         field_schema.update(type="string")


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

# --- User Models ---
class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def check_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class User(UserBase):
    id: str # For API responses, _id will be converted to str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Customer Models ---
class CustomerBase(BaseModel):
    customer_type: str # Added customer_type
    last_name: Optional[str] = None # Made optional
    first_name: Optional[str] = None # Made optional
    display_name: str
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: Optional[str] = None
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_type: Optional[str] = None # Added customer_type and made optional for updates
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    display_name: Optional[str] = None # Made optional
    middle_name: Optional[str] = None
    tin_no: Optional[str] = None
    sss_no: Optional[str] = None
    permanent_address: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    mobile_number: Optional[str] = None
    email_address: Optional[str] = None
    employer_name_address: Optional[str] = None
    job_title: Optional[str] = None
    salary_range: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    branch: str

class CustomerInDB(CustomerBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class Customer(CustomerBase):
    id: str # For API responses, _id will be converted to str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



# --- Ledger Entry Models ---
class LedgerEntry(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    transaction_id: str # Unique ID for the balanced transaction
    account: str # e.g., "Cash", "Loans Receivable"
    amount: Decimal
    entry_type: str # 'debit' or 'credit'
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )