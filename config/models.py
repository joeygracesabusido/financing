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


class PersonalInfo(SQLModel, table=True):
    """This function is for creating account per Holder"""
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(default=None, nullable=False)
    middle_name: str = Field(default=None, nullable=False)
    last_name: str = Field(default=None, nullable=False)
    suffix: str = Field(default=None, nullable=False)
    date_of_birth: date
    age: int = Field(default=0)
    permanent_address: str = Field(default=None, nullable=False)
    length_stay: int = Field(default=0)
    civil_status: str = Field(default=None, nullable=False)
    contact_num: str = Field(default=None, nullable=False)
    email_add: str = Field(default=None, nullable=False)
    place_of_birth: str = Field(default=None, nullable=False)
    nationality: str = Field(default=None, nullable=False)
    religion: str = Field(default=None, nullable=False)
    tin: str = Field(default=None, nullable=False)
    sss_gsis_no: str = Field(default=None, nullable=False)
    philsys_no: str = Field(default=None, nullable=False)
    sex: str = Field(default=None, nullable=False)
    name_of_spouse_co_borrower: str = Field(default=None)
    date_of_birth_spouse: date
    age_spouse: int = Field(default=None)
    source_of_income: str = Field(default=None)
    date_of_business_registration: str = Field(default=None, nullable=False)
    dti_sec_registration_no: str = Field(default=None, nullable=False)
    brgy_mayor_permit_no: str = Field(default=None, nullable=False)
    principal_business_address: str = Field(default=None, nullable=False)
    nature_of_business: str = Field(default=None)
    number_of_branch: int = Field(default=None)
    business_address_ownership: str = Field(default=None)
    date_updated: Optional[datetime] = Field(default=None)
    date_created: datetime = Field(default_factory=datetime.utcnow)


    accounttaggings: List["Account"] = Relationship(back_populates="accounttag")


class Branch(SQLModel, table=True):
    """This table is for creating Branch which is not Autogenerated
    for layway of the branch to put any of the characters
    """
    id: Optional[int] = Field(default=None, primary_key=True, unique=True)
    branch_name: str = Field(default=None, nullable=False, unique=True)
    branch_code: str = Field(default=None, nullable=True, unique=True)
    address: str = Field(default=None, nullable=False)
    date_updated: Optional[datetime] = Field(default=None)
    date_created: datetime = Field(default_factory=datetime.utcnow)

    accounttaggings: List["Account"] = Relationship(back_populates="branch_tag")


class Accounttype(SQLModel, table=True):
    """This table is for creating account type for Account Holder"""
    id: Optional[int] = Field(default=None, primary_key=True)
    accountTypeCode: str = Field(default=None, nullable=False, unique=True)
    type_of_account: str = Field(default=None, nullable=False)
    type_of_deposit: str = Field(default=None, nullable=False)
    date_updated: Optional[datetime] = Field(default=None)
    date_created: datetime = Field(default_factory=datetime.utcnow)

    accounttaggings: List["Account"] = Relationship(back_populates="account_type_tag")

class Account(SQLModel, table=True):
    """This is for tagging for every account holder"""
    id: Optional[int] = Field(default=None, primary_key=True)
    personal_info_id: int = Field(foreign_key=PersonalInfo.id)
    account_type_id: int = Field(foreign_key=Accounttype.id)
    branch_id: int = Field(foreign_key=Branch.id)
    account_number: str = Field(default=None, nullable=False)
    account_name: str = Field(default=None, nullable=False)
    status: str = Field(default="In-Active", nullable=False)
    date_updated: Optional[datetime] = Field(default=None)
    date_created: datetime = Field(default_factory=datetime.utcnow)



    accounttag: PersonalInfo = Relationship(back_populates="accounttaggings")
    account_type_tag: Accounttype = Relationship(back_populates="accounttaggings")
    branch_tag: Branch = Relationship(back_populates="accounttaggings")





# class AccountBalance(SQLModel, table=True):
#     """
#     """
#     id: Optional[int] = Field(default=None, primary_key=True)
#     account_no_tagging_id: int = Field(foreign_key=Account.id)
#     deposit: condecimal(max_digits=18, decimal_places=2) = Field(default=0)
#     withdrawal: condecimal(max_digits=18, decimal_places=2) = Field(default=0)
#     date_updated: Optional[datetime] = Field(default=None)
#     date_credited: datetime = Field(default_factory=datetime.utcnow)








def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # sqlmodel-db generate

# create_db_and_tables()