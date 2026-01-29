from fastapi import FastAPI
import strawberry
from strawberry.fastapi import GraphQLRouter
from .schema import Query, Mutation

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
