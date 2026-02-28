from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
from pydantic import BaseModel
from typing import Dict
import logging
import os

from .schema import Query as SchemaQuery, Mutation as SchemaMutation
from .user import Query as getUser, Mutation as createUser
from .customer import Query as getCustomer, Mutation as createCustomer
from .savings import SavingsQuery, SavingsMutation
from .transaction import TransactionQuery, TransactionMutation
from .loan import LoanQuery, LoanMutation, CollectionsQuery, ExtendedLoanMutation
from .loan_transaction import LoanTransactionQuery, LoanTransactionMutation
from .loan_product import LoanProductQuery, LoanProductMutation
from .branch import BranchQuery, BranchMutation
from .kyc import KYCQuery, KYCMutation
from .collateral import CollateralQuery, CollateralMutation
from .guarantor import GuarantorQuery, GuarantorMutation
from .chart_of_accounts import ChartOfAccountsQuery, ChartOfAccountsMutation, seed_chart_of_accounts
from .database import create_indexes, get_users_collection
from .database.crud import UserCRUD
from .database.postgres import engine
from .database.pg_models import Base
from .database.redis_client import get_redis, close_redis
from .auth.security import verify_token
from .audit_middleware import AuditMiddleware
from .utils.demo_seeder import seed_demo_data

logger = logging.getLogger(__name__)

# --- Pydantic Models for REST ---
class LoginRequest(BaseModel):
    username: str
    password: str


# --- GraphQL Schema composition -----------------------------------------------

@strawberry.type
class Query(
    getUser,
    getCustomer,
    SavingsQuery,
    TransactionQuery,
    LoanQuery,
    LoanTransactionQuery,
    LoanProductQuery,
    BranchQuery,
    KYCQuery,
    CollateralQuery,
    GuarantorQuery,
    CollectionsQuery,
    ChartOfAccountsQuery,
):
    pass


@strawberry.type
class Mutation(
    createUser,
    createCustomer,
    SchemaMutation,
    SavingsMutation,
    TransactionMutation,
    LoanMutation,
    LoanTransactionMutation,
    LoanProductMutation,
    BranchMutation,
    KYCMutation,
    CollateralMutation,
    GuarantorMutation,
    ChartOfAccountsMutation,
    ExtendedLoanMutation,
):
    pass


# --- Context ------------------------------------------------------------------

async def get_context(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")

    # GET requests (introspection / playground) – allow unauthenticated
    if request.method == "GET":
        return {"current_user": None}

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token = auth_header.replace("Bearer ", "", 1)
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject claim")

        users_collection = get_users_collection()
        user_crud = UserCRUD(users_collection)
        current_user = await user_crud.get_user_by_id(user_id)
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Attach to request state so AuditMiddleware can read it
        request.state.current_user = current_user

        return {"current_user": current_user}

    except HTTPException:
        raise
    except Exception as exc:
        logger.debug("Auth context error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(exc)}",
        )


# --- App lifecycle -----------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up — creating DB indexes and PG tables...")
    await create_indexes()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("PostgreSQL tables ensured.")
    # Seed Chart of Accounts
    try:
        await seed_chart_of_accounts()
        logger.info("Chart of Accounts seeded.")
    except Exception as exc:
        logger.warning("CoA seeding failed (non-fatal): %s", exc)
    
    # Seed Demo Data (if enabled)
    try:
        seed_demo = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"
        if seed_demo:
            logger.info("🌱 Seeding demo data...")
            await seed_demo_data()
            logger.info("✅ Demo data seeded successfully")
        else:
            logger.info("Demo data seeding disabled (set SEED_DEMO_DATA=true to enable)")
    except Exception as exc:
        logger.warning("Demo data seeding failed (non-fatal): %s", exc)
    
    # Warm up Redis connection
    try:
        await get_redis()
        logger.info("Redis connection established.")
    except Exception as exc:
        logger.warning("Redis connection failed (non-fatal): %s", exc)
    yield
    # Shutdown
    await close_redis()
    await engine.dispose()
    logger.info("Shutdown complete.")


# --- Build app ---------------------------------------------------------------

graphql_schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(graphql_schema, context_getter=get_context)

app = FastAPI(title="Lending MVP API — Phase 1", lifespan=lifespan)

# Audit middleware (must be added before CORS so it runs on all requests)
app.add_middleware(AuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
async def root():
    return {"message": "Lending MVP API — Phase 2", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# REST login bridge (unchanged — keeps HTML frontend compatible)
@app.post("/api-login/")
async def api_login(login_request: LoginRequest):
    try:
        from .user import Mutation as UserMutation
        from .schema import LoginInput
        
        mutation = UserMutation()
        login_input = LoginInput(
            username=login_request.username,
            password=login_request.password
        )
        
        result = await mutation.login(input=login_input)
        
        # Convert Strawberry object to dict for JSON response
        return {
            "accessToken": result.access_token,
            "tokenType": result.token_type,
            "refreshToken": result.refresh_token,
            "user": {
                "id": str(result.user.id),
                "username": result.user.username,
                "email": result.user.email,
                "fullName": result.user.full_name,
                "isActive": result.user.is_active,
                "role": result.user.role
            } if result.user else None
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )
