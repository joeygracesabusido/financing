from fastapi import FastAPI,APIRouter,Request,Response
import strawberry
import json
from fastapi.responses import JSONResponse

from strawberry.asgi import GraphQL
from strawberry.fastapi import GraphQLRouter
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse

from datetime import datetime, date

connection_string = "mysql+pymysql://{user}:{password}@{host}:{port}/{database}".format(
    user="joeysabusido",
    password=urllib.parse.quote("Genesis@11"),
    host="192.46.225.247",
     port=3306,
    database="financing"
)


engine = create_engine(connection_string, echo=True)


from config.models import User,Role
from typing import Optional,List

# @strawberry.type
# class User:
#     name: str
#     age: int


# @strawberry.type
# class Query:
#     @strawberry.field
#     async def user(self) -> User:
#         return User(name="Patrick", age=100) 






@strawberry.type
class RoleType:
    id: int
    roles: str
    approvalAmount: float
    date_credited: datetime

@strawberry.type
class Query:
    @strawberry.field
    async def roles(self) -> List[RoleType]:
        with Session(engine) as session:
            statement = select(Role).order_by(Role.roles)
            results = session.execute(statement) 
            data = results.all()
            
            result = data
            
            
        # Convert the data to RoleType objects
        role_types = [RoleType(id=role[0].id, 
                               roles=role[0].roles, approvalAmount=role[0].approvalAmount,
                               date_credited=role[0].date_credited
                               ) for role in data]
       
       
        return role_types

# Create a Strawberry schema
schema = strawberry.Schema(query=Query)
 
graphql_app = GraphQL(schema)


graph = APIRouter()

graph.add_route('/graphql',graphql_app)
graph.add_websocket_route("/graphql", graphql_app)

