from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
from pydantic import BaseModel
from typing import Dict

from .schema import Query, Mutation
from .user import Query as getUser, Mutation as createUser
from .customer import Query as getCustomer, Mutation as createCustomer
from .database import create_indexes, get_users_collection
from .database.crud import UserCRUD
from .auth.security import verify_token


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

# async def get_context(request: Request) -> Dict:
#     """Context getter for Strawberry"""
#     print("--- In get_context ---")
#     auth_header = request.headers.get("Authorization")
#     print(f"Authorization Header: {auth_header}")
    
#     current_user = None

#     if auth_header:
#         try:
#             token = auth_header.replace("Bearer ", "")
#             payload = verify_token(token)
#             print(f"Decoded Token Payload: {payload}")

#             if payload:
#                 user_id = payload.get("sub")
#                 print(f"User ID from token: {user_id}")
#                 if user_id:
#                     users_collection = get_users_collection()
#                     user_crud = UserCRUD(users_collection)
#                     current_user = await user_crud.get_user_by_id(user_id)
#                     print(f"User found in DB: {current_user is not None}")
#         except Exception as e:
#             print(f"Error in get_context: {e}")

#     print("--- Exiting get_context ---")
#     return {
#         "current_user": current_user
#     }

async def get_context(request: Request) -> dict:
    """Context getter for Strawberry – always requires valid token"""
    print("--- In get_context ---")
    auth_header = request.headers.get("Authorization")
    print(f"Authorization Header: {auth_header}")

    if not auth_header or not auth_header.startswith("Bearer "):
        print("--- No valid Bearer token → rejecting ---")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token = auth_header.replace("Bearer ", "", 1)
        payload = verify_token(token)
        print(f"Decoded Token Payload: {payload}")

        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject (sub) claim")

        users_collection = get_users_collection()
        user_crud = UserCRUD(users_collection)
        current_user = await user_crud.get_user_by_id(user_id)
        print(f"User found in DB: {current_user is not None}")

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        print("--- Exiting get_context (authenticated) ---")
        return {"current_user": current_user}

    except Exception as e:
        print(f"Error during authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


graphql_schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(graphql_schema, context_getter=get_context)

# --- FastAPI App ---
app = FastAPI(title="Lending MVP API")

@app.on_event("startup")
async def startup_event():
    await create_indexes()

# Configure CORS middleware
origins = [
    "http://localhost",
    "http://localhost:8080",  # Allow requests from your frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # We need a fresh schema instance to avoid context conflicts with the main GraphQL app
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
