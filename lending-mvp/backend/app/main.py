from fastapi import FastAPI
import strawberry
from strawberry.fastapi import GraphQLRouter
from .schema import Query, Mutation
from  .user import Query as getUser
from  .user import Mutation as createUser

@strawberry.type
class Query(getUser):
    pass

@strawberry.type
class Mutation(createUser):
    pass

# Create Strawberry's GraphQL schema
graphql_schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(graphql_schema)

# Create FastAPI app
app = FastAPI(title="Lending MVP API")

# Mount the GraphQL app
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {"message": "Welcome to the Lending MVP API"}

# --- REST Endpoints Example ---
# You can add REST endpoints here for simpler operations
# e.g. from .routes import loan_router
# app.include_router(loan_router, prefix="/api/v1")

@app.get("/api-login/")
async def api_login(username1: str, password1: str):
    # This is a bridge to the GraphQL login mutation
    # In a real-world application, you would either use GraphQL everywhere
    # or have a proper REST authentication system
    
    # Get the schema
    schema = strawberry.Schema(query=Query, mutation=Mutation)
    
    # Create a GraphQL query
    query = """
        mutation Login($username: String!, $password: String!) {
            login(input: {username: $username, password: $password}) {
                accessToken
                tokenType
                user {
                    id
                    username
                    email
                    fullName
                    isActive
                    role
                }
            }
        }
    """
    
    # Execute the query
    result = await schema.execute(
        query,
        variable_values={"username": username1, "password": password1}
    )
    
    # Return the result
    return result.data["login"]


