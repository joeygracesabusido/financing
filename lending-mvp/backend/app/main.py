from fastapi import FastAPI, HTTPException, status
import strawberry
from strawberry.fastapi import GraphQLRouter
from pydantic import BaseModel
from .schema import Query, Mutation
from .user import Query as getUser, Mutation as createUser
from .customer import Query as getCustomer, Mutation as createCustomer


# --- Pydantic Models for REST requests ---
class LoginRequest(BaseModel):
    username: str
    password: str

# --- Strawberry GraphQL Setup ---
@strawberry.type
class Query(getUser, getCustomer):
    pass

@strawberry.type
class Mutation(createUser, createCustomer):
    pass

graphql_schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(graphql_schema)

# --- FastAPI App ---
app = FastAPI(title="Lending MVP API")

app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {"message": "Welcome to the Lending MVP API"}

@app.post("/api-login/")
async def api_login(login_request: LoginRequest):
    """
    Bridge endpoint to the GraphQL login mutation.
    Accepts username and password in a POST request body.
    """
    schema = strawberry.Schema(query=Query, mutation=Mutation)
    
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
    
    result = await schema.execute(
        query,
        variable_values={
            "username": login_request.username,
            "password": login_request.password
        }
    )
    
    if result.errors:
        error = result.errors[0]
        original_error = getattr(error, 'original_error', None)

        if isinstance(original_error, HTTPException):
            raise original_error
        
        if "Incorrect username or password" in error.message:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during login.",
            )

    if result.data and result.data.get("login"):
        return result.data["login"]
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not process login response.",
        )
