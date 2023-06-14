from fastapi import FastAPI,APIRouter,Request,Response,HTTPException,status
import strawberry
import json
from fastapi.responses import JSONResponse

from strawberry.asgi import GraphQL
from strawberry.fastapi import GraphQLRouter
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse


from jose import JWTError, jwt

from datetime import datetime, date

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
JWT_SECRET = 'myjwtsecret'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30






from config.models import User,Role
from typing import Optional,List,Annotated


# @strawberry.type
# class User:
#     name: str
#     age: int


# @strawberry.type
# class Query:
#     @strawberry.field
#     async def user(self) -> User:
#         return User(name="Patrick", age=100) 


async def authenticate_user(authorization: str):
    if authorization is None:
        # Access token is missing, handle accordingly
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Extract the access token from the header
    token = authorization.replace("Bearer ", "")

    try:
        # Verify and decode the access token
        decoded_token = jwt.decode(token, "your-secret-key", algorithms=["HS256"])

        # Retrieve user information from the decoded token and return it
        user = User(id=decoded_token["sub"], username=decoded_token["username"])
        return user

    except jwt.ExpiredSignatureError:
        # Access token has expired, handle accordingly
        raise HTTPException(status_code=401, detail="Access token expired")

    except jwt.InvalidTokenError:
        # Invalid access token, handle accordingly
        raise HTTPException(status_code=401, detail="Invalid access token")

# @strawberry.field
# async def my_resolver(parent, info, some_argument: str, user: User = strawberry.field(default_value=None)):
#     if user is None:
#         # User is not authenticated, handle accordingly
#         raise Exception("Unauthorized")

#     # Perform any authorization checks based on the authenticated user
    
#     # Process the resolver logic
    
#     return user



from views.views import (getRoles,getuser,insertRole,get_access_tags,
                        updateAccessTags,insertBranch,getBranch,
                        insertAccountType,getAccountType)
from basemodel.basemodels import User
@strawberry.type
class RoleType:
    id: int
    roles: str
    approvalAmount: float
    date_credited: datetime

@strawberry.type
class User:
    id: int
    username: str
    email_add: str
    is_active: bool
    role_id: int


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
class AccountType:
    id: int
    accountTypeCode: str
    type_of_account: str
    type_of_deposit: str
    
@strawberry.type
class Query:
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
        
       
        branch_types = [AccountType(id=x.id,
                                    accountTypeCode=x.accountTypeCode,
                                    type_of_account=x.type_of_account,
                                    type_of_deposit=x.type_of_deposit
                               ) for x in data]
       
       
        return branch_types
       

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
    def insertBranchGraphql(self, info, branch_name: str, branch_code: str, address:str) -> str:
        """This function is for inserting Branch"""
        try:
            if len(branch_code) != 3 or not branch_code.isdigit():
                raise Exception("Branch code should be a 3-digit number")
            result = insertBranch(branch_code=branch_code,address=address,branch_name=branch_name)
        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

    @strawberry.mutation # this is for inserting Account Type
    def insertAccountTypeGraphql(self, info, accountTypeCode: str, type_of_account: str, type_of_deposit:str) -> str:
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

    


# Create a Strawberry schema
schema = strawberry.Schema(query=Query,mutation=Mutation)
 
graphql_app = GraphQL(schema)


graph = APIRouter()

graph.add_route('/graphql',graphql_app)
graph.add_websocket_route("/graphql", graphql_app)

