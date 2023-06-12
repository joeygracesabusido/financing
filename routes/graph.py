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


async def get_current_user(request:Request):

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




from views.views import (getRoles,getuser,insertRole)
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
    

    @strawberry.field
    async def getUserWithID(self,info,username: str) -> User:
        """This function is for Querying user tru username"""
        user = getuser(username=username)

        return user
    

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def insertRole_grphql(self, info,roles: str,approvalAmount: float,
                                ) -> str:
        """This function is to insert or roles to database"""
        result = insertRole(roles=roles,approvalAmount=approvalAmount)
        return str('Data has been Save')


# Create a Strawberry schema
schema = strawberry.Schema(query=Query,mutation=Mutation)
 
graphql_app = GraphQL(schema)


graph = APIRouter()

graph.add_route('/graphql',graphql_app)
graph.add_websocket_route("/graphql", graphql_app)

