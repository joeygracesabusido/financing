from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os

from .database import create_tables
from .database.postgres import engine
from .database.redis_client import get_redis, close_redis
from .audit_middleware import AuditMiddleware
# Import the PostgreSQL-only enhanced seeder
try:
    from .utils.demo_seeder_enhanced import seed_demo_data_enhanced
    DEMO_SEEDER_AVAILABLE = True
except ImportError:
    DEMO_SEEDER_AVAILABLE = False
    seed_demo_data_enhanced = None

# Import all routers to register routes
from . import login_endpoint
from . import rest_api  # REST API endpoints for frontend
from . import graphql  # GraphQL endpoint for frontend

logger = logging.getLogger(__name__)

# --- Pydantic Models for REST ---
class LoginRequest(BaseModel):
    username: str
    password: str


# --- App lifecycle ------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up — creating PostgreSQL tables...")
    await create_tables()
    logger.info("PostgreSQL tables ensured.")
    
    # Seed Chart of Accounts
    try:
        from .chart_of_accounts import seed_chart_of_accounts
        await seed_chart_of_accounts()
        logger.info("Chart of Accounts seeded.")
    except Exception as exc:
        logger.warning("CoA seeding failed (non-fatal): %s", exc)
    
    # Seed Demo Data (if enabled) - PostgreSQL-only
    try:
        seed_demo = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"
        if seed_demo and DEMO_SEEDER_AVAILABLE:
            logger.info("🌱 Seeding demo data (PostgreSQL-enhanced)...")
            await seed_demo_data_enhanced()
            logger.info("✅ Demo data seeded successfully")
        elif seed_demo and not DEMO_SEEDER_AVAILABLE:
            logger.warning("Demo data seeding requested but enhanced seeder not available. Install pymongo or use demo_seeder_enhanced.py")
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

app = FastAPI(title="Lending MVP API — Phase 2", lifespan=lifespan)

# Include login endpoint
app.include_router(login_endpoint.router, prefix="")

# Include REST API endpoints
app.include_router(rest_api.router, prefix="")

# Include GraphQL endpoint (Strawberry)
from .graphql import schema
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute

# Add GraphQL route
from fastapi import Request

@app.post("/graphql")
async def graphql_endpoint(request: Request):
    # Get query from JSON body or form data
    import json
    body = await request.json() if request.headers.get('content-type') == 'application/json' else {}
    graphql_query = body.get('query', '')
    
    if not graphql_query:
        return JSONResponse({"errors": [{"message": "Missing query"}]}, status_code=400)
    
    import asyncio
    try:
        async def execute_query():
            result = await schema.execute(graphql_query)
            # Convert errors to dictionaries if they're GraphQLError objects
            errors = []
            if result.errors:
                for error in result.errors:
                    error_dict = {"message": str(error)}
                    if hasattr(error, 'locations') and error.locations:
                        error_dict["locations"] = [{"line": loc.line, "column": loc.column} for loc in error.locations]
                    if hasattr(error, 'path') and error.path:
                        error_dict["path"] = error.path
                    errors.append(error_dict)
            return {
                "data": result.data,
                "errors": errors
            }
        result = await execute_query()
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({
            "errors": [{"message": str(e)}]
        }, status_code=500)

# Audit middleware (must be added before CORS so it runs on all requests)
app.add_middleware(AuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Lending MVP API — Phase 2", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}