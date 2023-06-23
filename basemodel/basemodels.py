from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class User(BaseModel):
    username: str 
    hashed_password: str 
    email_add: str
    is_active: bool 
    role_id: int

class TokenData(BaseModel):
    username: str 
    scopes: str


class Token(BaseModel):
    access_token: str
    token_type: str


class RoleData(BaseModel):
    id: int
    roles: str
    approvalAmount: float
    date_updated: Optional[datetime]
    date_credited: Optional[datetime]

class UserAccessTags(BaseModel):
    user_id: int
    read_loan: bool
    write_loan: bool
    read_deposit: bool
    write_deposit: bool
    read_withdrawal: bool
    write_withdrawal: bool
    read_accounting: bool
    write_accounting: bool
    read_accesstagging: bool
    write_accesstagging: bool
    read_accounts: bool
    write_accounts: bool
    read_userLog: bool
    write_userLog: bool
    date_updated: Optional[datetime]
    date_credited: Optional[datetime]


class Branch:
    id: int
    branch_name: str
    branch_code: str
    address: str