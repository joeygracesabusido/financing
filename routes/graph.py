from fastapi import FastAPI,APIRouter,Request,Response,HTTPException,status,Depends,Header
import strawberry
import json
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


from strawberry.asgi import GraphQL
from strawberry.fastapi import GraphQLRouter
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


from jose import JWTError, jwt

# from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from datetime import datetime, date

from strawberry.types import Info

import starlette.requests


from strawberry.permission import BasePermission
from strawberry.types import Info

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
JWT_SECRET = 'myjwtsecret'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()



import typing







    

from config.models import User,Role
from typing import Optional,List

admin = APIRouter()
# @strawberry.type
# class User:
#     name: str
#     age: int


# @strawberry.type
# class Query:
#     @strawberry.field
#     async def user(self) -> User:
#         return User(name="Patrick", age=100) 





from views.views import (getRoles,getuser,insertRole,get_access_tags,
                        updateAccessTags,insertBranch,getBranch,
                        insertAccountType,getAccountType,insertAccount,
                        getAccount,updateAccount)
from views.views import insertPersonalInfo
from basemodel.basemodels import User



#=====================================================Authentication==========================================
from functools import cached_property
import strawberry
from strawberry.fastapi import BaseContext, GraphQLRouter
from strawberry.types import Info as _Info
from strawberry.types.info import RootValueType

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
    # accountTypeCode: str

# class IsAuthenticated():
#     message = "User is not authenticated"

    # This method can also be async!

@admin.get("/current-user/")
async def has_permission(request:Request):
    try :
        token = request.cookies.get('access_token')
        
        # print(token)
        if token is None:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail= "Not Authorized",
            # headers={"WWW-Authenticate": "Basic"},
            )
        else:
            scheme, _, param = token.partition(" ")
            payload = jwt.decode(param, SECRET_KEY, algorithms=ALGORITHM)
        
            username = payload.get("sub")    
            
            expiration_time = datetime.fromtimestamp(payload.get("exp"))
            # print(expiration_time)
            # print(datetime.utcnow())

            
            if datetime.utcnow() > expiration_time:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired. Please login again.",
                )

            # response_data = {"username": username}
            return username

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail= "Session has expired",
            # headers={"WWW-Authenticate": "Basic"},
        )

class AuthenticationMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, request, handler):
        # Perform authentication logic here
        authenticated_user = self.authenticate(request)

        # Add the authenticated_user to the context
        request.context["authenticated_user"] = authenticated_user

        # Call the next middleware or handler
        return await self.app(request, handler)

    def authenticate(self, request):
        # Your authentication logic here
        # Return the authenticated user or None
        # Example implementation:
        username = request.headers.get("username")
        password = request.headers.get("password")

        user = getuser(username=username)
        if user:
            username = user.username
            hashed_password = user.hashed_password
            password_check = pwd_context.verify(password, hashed_password)
            if password_check:
                return User(username=username)

        return None





    
@strawberry.type
class Query:
    # @strawberry.field
    # async def getcurrentUser(current_user: Annotated[User, Depends(has_permission)]) -> User:
    #     return current_user

    
    @strawberry.field
    async def authenticated_user(self, info,username: str, password: str) -> User:
        user = getuser(username=username)
        if user:
            username = user.username
            hashed_password = user.hashed_password
            password_check = pwd_context.verify(password, hashed_password)
            if password_check:
                return User(username=username)
        return None

        

    #
    
    @strawberry.field
    async def roles(self) -> List[RoleType]:
        

        
    
        data = getRoles()
        
        # for role in data:
        #     id = role.id
        #     print(id)
        # Convert the data to RoleType objects
        role_types = [RoleType(id=role.id, 
                            roles=role.roles, approvalAmount=role.approvalAmount,
                            date_credited=role.date_credited
                            ) for role in data]
    
    
        return role_types
    
    @strawberry.field # this is for getting the approval amount for roles
    async def getrolesApprovalAmount(self,
                                    min_approval_amount: Optional[int] = None,
                                    max_approval_amount: Optional[int] = None
                                ) -> List[RoleType]:
        data = getRoles()

        if min_approval_amount is not None:
            # Filter the data based on the minimum approval amount
            data = [role for role in data if role.approvalAmount >= min_approval_amount]

        if max_approval_amount is not None:
            # Filter the data based on the maximum approval amount
            data = [role for role in data if role.approvalAmount <= max_approval_amount]

        role_types = [
            RoleType(
                id=role.id,
                roles=role.roles,
                approvalAmount=role.approvalAmount,
                date_credited=role.date_credited
            ) for role in data
        ]

        return role_types

    
 

    @strawberry.field
    async def getUserWithID(self,info,username: str) -> User:
        """This function is for Querying user tru username"""
        user = getuser(username=username)

        return user
    @strawberry.field
    async def userAccestags_graphql(self,info) -> List[Useraccesstags]:
        """This function is for Querying Useraccesstagas"""
        data = get_access_tags()

        accesstags = [Useraccesstags(id=x.id,
                        user_id=x.user_id,
                        read_loan=x.read_loan,
                        write_loan=x.read_loan,
                        read_deposit=x.read_deposit,
                        write_deposit=x.write_deposit,
                        read_withdrawal=x.read_withdrawal,
                        write_withdrawal=x.write_withdrawal,
                        read_accounting=x.read_accounting,
                        write_accounting=x.write_accounting,
                        read_accesstagging=x.read_accesstagging,
                        write_accesstagging=x.write_accesstagging,
                        read_accounts=x.read_accounts,
                        write_accounts=x.write_accounts,
                        read_userLog=x.read_userLog,
                        write_userLog=x.write_userLog)for x in data]
        return accesstags


    @strawberry.field # this is to query Branches
    async def getBranchGraphql(self, info) -> List[Branch]:
        """this is to query Branches"""
        data = getBranch()
        
       
        branch_types = [Branch(id=x.id, 
                               branch_name=x.branch_name,
                               branch_code=x.branch_code,
                               address=x.address
                               ) for x in data]
       
       
        return branch_types

    @strawberry.field # this is to query Branches
    async def getBranchGraphql_autocomplete(self, info) -> List[BranchAutoComplete]:
        """this is to query Branches"""
        data = getBranch()
        
       
        branch_types = [BranchAutoComplete( 
                               branch_name=x.branch_name,
                               
                               ) for x in data]
       
       
        return branch_types

    @strawberry.field # this is for querying in Branches with parameters of branch Name
    async def searchBranch(self, search_term: str) -> List[Branch]:

        """this is for querying in Branches with parameters of branch Name"""
        branches = getBranch()

        filtered_branches = list(filter(lambda branch: search_term.lower() in branch.branch_name.lower(), branches))

        return filtered_branches


    @strawberry.field # this is to query Branches
    async def getAccountTypeGraphql(self, info) -> List[AccountType]:
        """this is to query Branches"""
        data = getAccountType()
        
       
        accont_type = [AccountType(id=x.id,
                                    accountTypeCode=x.accountTypeCode,
                                    type_of_account=x.type_of_account,
                                    type_of_deposit=x.type_of_deposit
                               ) for x in data]
       
       
        return accont_type

    @strawberry.field # this is for querying in  with parameters of branch Name
    async def searchAccounttype(self, search_term: str) -> List[AccountType]:

        """this is for querying in Branches with parameters of branch Name"""
        accountTypes = getAccountType()

        filtered_branches = list(filter(lambda accounttype: search_term.lower() in accounttype.type_of_deposit.lower(), accountTypes))

        return filtered_branches
    
    
    


    @strawberry.field # this is to query Accounts
    async def getAccount_grphql(self) -> List[AccountList]:
        """this is to query Branches"""
        data = getAccount()
        
       
        account_list = [AccountList(id=x.id,
                                    account_number=x.account_number,
                                    account_name=x.account_name
                               ) for x in data]
       
       
        return account_list

    # @strawberry.field
    # async def get_authenticated_user(self, info: Info) -> User | None:
    #     return info.context.user

    
       


    
       

#=================================================Mutation space=======================================================
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def insertRole_grphql(self, info,roles: str,approvalAmount: float,
                                ) -> str:
        """This function is to insert or roles to database"""

        result = insertRole(roles=roles,approvalAmount=approvalAmount)
        return str('Data has been Save')

    @strawberry.mutation
    async def updateAccess(self, info,   # this is for update function
                                        user_id: int,
                                        read_loan: bool,
                                        write_loan: bool,
                                        read_deposit: bool,
                                        write_deposit: bool,
                                        read_withdrawal: bool,
                                        write_withdrawal: bool,
                                        read_accounting: bool,
                                        write_accounting: bool,
                                        read_accesstagging: bool, 
                                        write_accesstagging: bool,
                                        read_accounts: bool, 
                                        write_accounts: bool,
                                        read_userLog: bool, 
                                        write_userLog: bool,
                                        id:int
                                ) -> str:
        """This function is to insert or roles to database"""
        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        try:
            result = updateAccessTags(id=id, user_id=user_id,
                                            read_loan=read_loan,
                                            write_loan=write_loan,
                                            read_deposit=read_deposit,
                                            write_deposit=write_deposit,
                                            read_withdrawal=read_withdrawal,
                                            write_withdrawal=write_withdrawal,
                                            read_accounting=read_accounting,
                                            write_accounting=write_accounting,
                                            read_accesstagging=read_accesstagging,
                                            write_accesstagging=write_accesstagging,
                                            read_accounts=read_accounts,
                                            write_accounts=write_accounts,
                                            read_userLog=read_userLog,
                                            write_userLog=write_userLog,
                                            date_updated=date_updated)

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been updated')


    @strawberry.mutation # this is for inserting Branch
    async def insertBranchGraphql(self, info, branch_name: str, branch_code: str, address:str) -> str:
        """This function is for inserting Branch"""
        try:
            if len(branch_code) != 3 or not branch_code.isdigit():
                raise Exception("Branch code should be a 3-digit number")
            result = insertBranch(branch_code=branch_code,address=address,branch_name=branch_name)
        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

    @strawberry.mutation # this is for inserting Account Type
    async def insertAccountTypeGraphql(self, info, accountTypeCode: str, type_of_account: str, type_of_deposit:str) -> str:
        """This function is for inserting Account"""
        try:
            if len(accountTypeCode) != 2 or not accountTypeCode.isdigit():
                raise Exception("AccountTypeCode code should be a 2-digit number")
            result = insertAccountType(accountTypeCode=accountTypeCode,
                                        type_of_account=type_of_account,
                                        type_of_deposit=type_of_deposit)
        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

    #==================================Login==================================
    @strawberry.mutation
    async def login(self, username: str, password: str) -> LoginResult:
        user = getuser(username=username)
        
        if user:
            username = user.username
            hashed_password = user.hashed_password
           

            password_check = pwd_context.verify(password, hashed_password)
            if password_check:
                return LoginSuccess(user=User(username=username))
                # return username

        return LoginError(message="Invalid username or password") 

#=====================================insert Personal Info====================================
    
    @strawberry.mutation
    async def insertPersonalInfo_gql(first_name:str,
                        middle_name: str,
                        last_name:str,
                        suffix:str,
                        date_of_birth:date,
                        age:int,
                        permanent_address:str,
                        length_stay:int,
                        civil_status:str,
                        contact_num:str,
                        email_add:str,
                        place_of_birth:str,
                        nationality:str,
                        religion:str,
                        tin:str,
                        sss_gsis_no:str,
                        philsys_no:str,
                        sex:str,
                        name_of_spouse_co_borrower:str,
                        date_of_birth_spouse:date,
                        age_spouse:str,
                        source_of_income:str,
                        date_of_business_registration:str,
                        dti_sec_registration_no:str,
                        brgy_mayor_permit_no:str,
                        principal_business_address:str,
                        nature_of_business:str,
                        number_of_branch:int,
                        business_address_ownership:str,
                        ) -> str:
        """This function is for inserting Personal info for Accounts"""

        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        try:
            result = insertPersonalInfo(first_name=first_name,
                        middle_name=middle_name,
                        last_name=last_name,
                        suffix=suffix,
                        date_of_birth=date_of_birth,
                        age=age,
                        permanent_address=permanent_address,
                        length_stay=length_stay,
                        civil_status=civil_status,
                        contact_num=contact_num,
                        email_add=contact_num,
                        place_of_birth=email_add,
                        nationality=place_of_birth,
                        religion=nationality,
                        tin=tin,
                        sss_gsis_no=sss_gsis_no,
                        philsys_no=philsys_no,
                        sex=sex,
                        name_of_spouse_co_borrower=name_of_spouse_co_borrower,
                        date_of_birth_spouse=date_of_birth_spouse,
                        age_spouse=age_spouse,
                        source_of_income=source_of_income,
                        date_of_business_registration=date_of_business_registration,
                        dti_sec_registration_no=dti_sec_registration_no,
                        brgy_mayor_permit_no=brgy_mayor_permit_no,
                        principal_business_address=principal_business_address,
                        nature_of_business=nature_of_business,
                        number_of_branch=number_of_branch,
                        business_address_ownership=business_address_ownership
                        )

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')
    

    #=====================================insert Accounts====================================
    
    @strawberry.mutation
    async def insertAccount_gql(personal_info_id: int,account_type_id: int,
                                branch_id: int,account_name: str,accountTypeCode: str
                        ) -> str:
        """This function is for inserting Personal info for Accounts"""

        branch = getBranch()
        
        
        account_type =  getAccountType()
        account = getAccount()

        # Find the branch with the given ID
        # selected_branch = next((b for b in branch if b[0]["id"] == branch_id), None)
        selected_branch = next((b for b in branch if b.id == branch_id), None)
        # print(selected_branch.id)
        # Find the account type with the given ID
        selected_account_type = next((a for a in account_type if a.accountTypeCode == accountTypeCode), None)
        # print(selected_account_type.accountTypeCode)

        if selected_branch and selected_account_type:
            # Generate account number with an incrementing last digit
            branchcode = selected_branch.branch_code
            accountTypeCode = selected_account_type.accountTypeCode
            accountTypeCode_id = selected_account_type.id

            existing_accounts = [acc for acc in account if acc.branch_id == branch_id and acc.account_type_id == account_type_id]
            # print(existing_accounts)
            if existing_accounts:
                last_account_number = max(existing_accounts, key=lambda x: int(x.account_number))
                last_digit = int(last_account_number.account_number[-7:])
                incremented_last_digit = last_digit + 1
                account_number = f"{branchcode:03}{accountTypeCode:02}{incremented_last_digit:07}"
            else:
                account_number = f"{branchcode:03}{accountTypeCode:02}0000001"

                        # Ensure account number is always 12 digits
            account_number = account_number.zfill(12)

            # print(account_number)
        
        # if selected_branch and selected_account_type:
        #     # Generate account number with an incrementing last digit
        #     account_number = f"{selected_branch.branch_code}{selected_account_type.accountTypeCode}0000001"
        #     if account:
        #         last_account = account[-1]
        #         last_account_number = last_account.account_number
        #         last_digit = int(last_account_number[-1])
        #         incremented_last_digit = last_digit + 1
        #         account_number = f"{selected_branch.branch_code}{selected_account_type.accountTypeCode}000000{incremented_last_digit:03}"

        # current_datetime = datetime.now()
        # date_updated = current_datetime.isoformat()

        # print(personal_info_id,account_number)

        try:
            result = insertAccount( personal_info_id=personal_info_id,
                             account_type_id=account_type_id,
                             branch_id=branch_id,
                             account_number=account_number,
                             account_name=account_name
                        )

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

#=================================This is for Updating Account ===================================
    @strawberry.mutation
    async def updateAccount_graphql(self, info,   # this is for update function
                                        personal_info_id: int,
                                        account_type_id: int,
                                        branch_id: int,
                                        # account_number: str,
                                        account_name: str, 
                                        accountTypeCode: str, 
                                        id:int
                                ) -> str:
        """This function is to insert or roles to database"""
        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        branch = getBranch()
        
        
        account_type =  getAccountType()
        account = getAccount()

        # Find the branch with the given ID
        # selected_branch = next((b for b in branch if b[0]["id"] == branch_id), None)
        selected_branch = next((b for b in branch if b.id == branch_id), None)
        
        # Find the account type with the given ID
        selected_account_type = next((a for a in account_type if a.accountTypeCode == accountTypeCode), None)
        # print(selected_account_type.accountTypeCode)
        if selected_branch and selected_account_type:
            # Generate account number with an incrementing last digit
            branchcode = selected_branch.branch_code
            accountTypeCode = selected_account_type.accountTypeCode
            accountTypeCode_id = selected_account_type.id

            existing_accounts = [acc for acc in account if acc.branch_id == branch_id and acc.account_type_id == account_type_id]
            # print(existing_accounts)
            if existing_accounts:
                last_account_number = max(existing_accounts, key=lambda x: int(x.account_number))
                last_digit = int(last_account_number.account_number[-7:])
                incremented_last_digit = last_digit + 1
                account_number = f"{branchcode:03}{accountTypeCode:02}{incremented_last_digit:07}"
            else:
                account_number = f"{branchcode:03}{accountTypeCode:02}0000001"

                        # Ensure account number is always 12 digits
            
        
            account_number = account_number.zfill(12)

            print(account_number)

        try:
            result = updateAccount(id=id, 
                                        personal_info_id=personal_info_id,
                                        account_type_id=account_type_id,
                                        branch_id=branch_id,
                                        account_number=account_number,
                                        account_name=account_name,  
                                            date_updated=date_updated)

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been updated')

     
     
           

# async def get_context() -> Context:
#     return Context()  




# Create a Strawberry schema
schema = strawberry.Schema(query=Query,mutation=Mutation)
 
graphql_app = GraphQL(schema)

graphql_app = GraphQLRouter(
    schema,
)

# graphql_app = GraphQLRouter(
#     schema,
#     context_getter=get_context,
# )


# graph = APIRouter()

# graph.add_route('/graphql',graphql_app)
# graph.add_websocket_route("/graphql", graphql_app)



