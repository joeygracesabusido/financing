from pydantic import BaseModel
from datetime import datetime, date


class User(BaseModel):
    username: str 
    hashed_password: str 
    email_add: str
    is_active: str 
    role_id: int