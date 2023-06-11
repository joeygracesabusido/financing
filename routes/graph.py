from fastapi import FastAPI,APIRouter,Request,Response
import strawberry
import json
from fastapi.responses import JSONResponse

from strawberry.asgi import GraphQL
from strawberry.fastapi import GraphQLRouter
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse



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

@strawberry.type
class Query:
    @strawberry.field
    async def roles(self) -> List[RoleType]:
        with Session(engine) as session:
            statement = select(Role).order_by(Role.roles)
            results = session.execute(statement) 
            data = results.all()
            
        result = data
    
        # rolesData = [
        #             {
        #                 "id": x.id,
        #                 "roles": x.roles,
                    
        #             }
        #             for x in result
        #         ]
        # print(rolesData)
        # Convert the data to RoleType objects
        role_types = [RoleType(id=role.id, roles=role.roles) for role in data]
       
       
        return data

# Create a Strawberry schema
schema = strawberry.Schema(query=Query)
 
graphql_app = GraphQL(schema)


graph = APIRouter()

graph.add_route('/graphql',graphql_app)
graph.add_websocket_route("/graphql", graphql_app)

# # Add a route for the /graphql endpoint
# @graph.get("/graphql")
# async def graphql(request: Request):
#     try:
#         request_data = await request.json()
#     except Exception as e:
#         return JSONResponse({"error": "Invalid JSON data"}, status_code=400)

#     query = request_data.get("query")
#     variables = request_data.get("variables")
#     operation_name = request_data.get("operationName")

#     if not query:
#         return JSONResponse({"error": "Missing 'query' field in request"}, status_code=400)

#     # Process the GraphQL query and return the response

#     return {"message": "GraphQL request received"}
