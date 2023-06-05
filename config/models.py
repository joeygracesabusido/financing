from typing import Optional,List
from pydantic import condecimal
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group,Relationship

from datetime import datetime, date


import urllib.parse





connection_string = "mysql+pymysql://{user}:{password}@{host}:{port}/{database}".format(
    user="joeysabusido",
    password=urllib.parse.quote("Genesis@11"),
    host="192.46.225.247",
     port=3306,
    database="financing"
)



engine = create_engine(connection_string, echo=True)


roles = [{
    "admin": 1,
    "manager": 2,
    "supervisor": 3,
    "rank_file": 4,
    "user": 5
}]

# Role List and Function
    # admin = includes IT department and Developer
    #         can access basic Function CRUD 
    # manager = can do basic function (CRUD) but cannot access to database

class Role(SQLModel, table=True):
    """This is to create role"""
    id: Optional[int] = Field(default=None, primary_key=True)
    roles: str = Field(index=True, default=None)
    approvalAmount: condecimal(max_digits=18, decimal_places=2) = Field(default=0)
    date_updated: Optional[datetime] = Field(default=None)
    date_credited: datetime = Field(default_factory=datetime.utcnow)

    users: List["User"] = Relationship(back_populates="role")


class User(SQLModel, table=True):
    """This is to create user Table"""
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str = Field(nullable=False)
    email_add: str = Field(nullable=False)
    is_active: bool = Field(default=False)
    role_id: int = Field(foreign_key=Role.id)
    date_updated: Optional[datetime] = Field(default=None)
    date_credited: datetime = Field(default_factory=datetime.utcnow)

    role: Role = Relationship(back_populates="users")
    account_taggings: List["UserRoleAccessTagging"] = Relationship(back_populates="user")


# class Account(SQLModel, table=True):
#     """This is account info for Clients"""
#     id: Optional[int] = Field(default=None, primary_key=True)
#     user_account_taggings: List['UserRoleAccessTagging'] = Relationship(back_populates='account')


class UserRoleAccessTagging(SQLModel, table=True):
    """This is for tag for user account"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key=User.id)
    # account_id: int = Field(foreign_key=Account.id)

    
    read_loan: bool = Field(default=False)
    write_loan: bool = Field(default=False)
    read_deposit: bool = Field(default=False)
    write_deposit: bool = Field(default=False)
    read_withdrawal: bool = Field(default=False)
    write_withdrawal: bool = Field(default=False)
    read_accounting: bool = Field(default=False)
    write_accounting: bool = Field(default=False)
    read_accesstagging: bool = Field(default=False)
    write_accesstagging: bool = Field(default=False)
    read_accounts: bool = Field(default=False)
    write_accounts: bool = Field(default=False)
    read_userLog: bool = Field(default=False)
    write_userLog: bool = Field(default=False)

    date_updated: Optional[datetime] = Field(default=None)
    date_credited: datetime = Field(default_factory=datetime.utcnow)

    user: Optional['User'] = Relationship(back_populates='account_taggings')
    # account: Optional['Account'] = Relationship(back_populates='user_account_taggings')

# class employee(SQLModel, table=True):
#     """"""

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # sqlmodel-db generate

# create_db_and_tables()