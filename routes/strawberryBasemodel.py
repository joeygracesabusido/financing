import strawberry
from typing import Optional,List

from datetime import datetime

@strawberry.type
class LoginSuccess:
    user: str  


@strawberry.type
class LoginError:
    message: str

LoginResult = strawberry.union("LoginResult", (LoginSuccess, LoginError))

# class Context(BaseContext):
#     @cached_property
#     def user(self) -> User | None:
#         if not self.request:
#             return None

#         authorization = self.request.headers.get("Authorization", None)
#         return authorization_service.authorize(authorization)


# Info = _Info[Context, RootValueType]





# async def get_context() -> Context:
#     return Context()

# class Context(BaseContext):
#     @cached_property
#     def user(self) -> User | None:
#         if not self.request:
#             return None

#         authorization = self.request.headers.get("Authorization", None)
#         return authorization_service.authorize(authorization)


# Info = _Info[Context, RootValueType]





@strawberry.type
class RoleType:
    id: int
    roles: str
    approvalAmount: float
    date_credited: datetime

@strawberry.type
class User:
    # id: int
    username: str
    # password: str
    # email_add: str
    # is_active: bool
    # role_id: int


@strawberry.type
class Useraccesstags:
    id: Optional[int] 
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
    # date_updated: Optional[datetime]


@strawberry.type
class Branch:
    id: int
    branch_name: str
    branch_code: str
    address: str

@strawberry.type
class BranchAutoComplete:
   
    branch_name: str
  

@strawberry.type
class AccountType:
    id: int
    accountTypeCode: str
    type_of_account: str
    type_of_deposit: str

@strawberry.input
class UserInput:
    username: str

@strawberry.type
class AccountList:
    id:int
    # personal_info_id: int
    # account_type_id: int
    # branch_id: int
    account_name: str
    account_number: str
    status: str
    # accountTypeCode: str

@strawberry.type
class PersonalInfoAutoComplete:
    first_name: str 
    middle_name: str
    last_name: str


# class IsAuthenticated():
#     message = "User is not authenticated"

    # This method can also be async!




