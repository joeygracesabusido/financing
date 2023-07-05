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

# admin = APIRouter()
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
                        getAccount,updateAccount,getPersonalInfo)
from views.views import insertPersonalInfo
from basemodel.basemodels import User


from views.query import Query
from views.mutation import Mutation



#=====================================================Authentication==========================================

import strawberry






    


     
           

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



