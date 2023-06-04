from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class User(BaseModel):
    username: str 
    hashed_password: str 
    email_add: str
    is_active: str 
    role_id: int

class TokenData(BaseModel):
    username: str | None = None
    scopes: list[str] = []


class Token(BaseModel):
    access_token: str
    token_type: str


class RoleData(BaseModel):
    id: int
    roles: str
    approvalAmount: float
    date_updated: Optional[datetime]
    date_credited: Optional[datetime]