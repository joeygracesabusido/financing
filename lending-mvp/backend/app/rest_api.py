"""
REST API endpoints for frontend integration.
This module provides REST endpoints that the frontend can use instead of GraphQL.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from .database import get_async_session_local
from .database.pg_core_models import User, Customer
from .auth.security import verify_password, create_access_token, create_refresh_token
from .auth.rbac import get_sql_branch_filter

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api-login/")


# ── Auth Endpoints ───────────────────────────────────────────────────────────
@router.post("/api-login/")
async def api_login(username: str, password: str, totp_code: Optional[str] = None):
    """Login endpoint."""
    session_factory = get_async_session_local()
    async with session_factory() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        user_id = str(user.uuid if user.uuid is not None else user.id)
        access_token = create_access_token({"sub": user_id})
        refresh_token, jti = create_refresh_token({"sub": user_id})
        
        return {
            "accessToken": access_token,
            "tokenType": "bearer",
            "refreshToken": refresh_token,
            "user": {
                "id": user_id,
                "username": user.username,
                "email": user.email,
                "fullName": user.full_name,
                "isActive": user.is_active,
                "role": user.role,
            }
        }


# ── Users Endpoints ──────────────────────────────────────────────────────────
@router.get("/api/users")
async def get_users(skip: int = 0, limit: int = 100):
    """Get all users."""
    session_factory = get_async_session_local()
    async with session_factory() as session:
        result = await session.execute(
            select(User).offset(skip).limit(limit)
        )
        users = result.scalars().all()
        return {
            "success": True,
            "message": "Users retrieved successfully",
            "users": [
                {
                    "id": str(u.uuid if u.uuid is not None else u.id),
                    "email": u.email,
                    "username": u.username,
                    "fullName": u.full_name,
                    "isActive": u.is_active,
                    "role": u.role,
                    "createdAt": str(u.created_at),
                    "updatedAt": str(u.updated_at),
                }
                for u in users
            ],
            "total": len(users),
        }


@router.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Lending MVP API is running"}


@router.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Lending MVP API — Phase 2", "version": "2.0.0"}
