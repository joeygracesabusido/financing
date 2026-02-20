"""
Branch / Office GraphQL types, queries, and mutations.
Backed by PostgreSQL via SQLAlchemy (Phase 1).
"""
import strawberry
from typing import List, Optional
from strawberry.types import Info
from datetime import datetime

from .database.postgres import AsyncSessionLocal
from .database.pg_models import Branch
from sqlalchemy import select, update, delete


# ── GraphQL Types ─────────────────────────────────────────────────────────────

@strawberry.type
class BranchType:
    id: int
    code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contact_number: Optional[str] = strawberry.field(name="contactNumber", default=None)
    is_active: bool = strawberry.field(name="isActive", default=True)
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")


@strawberry.input
class BranchCreateInput:
    code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contact_number: Optional[str] = None


@strawberry.input
class BranchUpdateInput:
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact_number: Optional[str] = None
    is_active: Optional[bool] = None


@strawberry.type
class BranchResponse:
    success: bool
    message: str
    branch: Optional[BranchType] = None


@strawberry.type
class BranchesResponse:
    success: bool
    message: str
    branches: List[BranchType]
    total: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_type(row: Branch) -> BranchType:
    return BranchType(
        id=row.id,
        code=row.code,
        name=row.name,
        address=row.address,
        city=row.city,
        contact_number=row.contact_number,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _require_admin(info: Info):
    user = info.context.get("current_user")
    if not user or user.role not in ("admin", "branch_manager"):
        raise Exception("Not authorized — admin or branch_manager role required")
    return user


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class BranchQuery:
    @strawberry.field
    async def branches(self, info: Info) -> BranchesResponse:
        """List all branches. Any authenticated user can view."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Not authenticated")
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Branch).order_by(Branch.name))
            rows = result.scalars().all()
        branches = [_row_to_type(r) for r in rows]
        return BranchesResponse(success=True, message="OK", branches=branches, total=len(branches))

    @strawberry.field
    async def branch(self, info: Info, branch_id: int) -> BranchResponse:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Not authenticated")
        async with AsyncSessionLocal() as session:
            row = await session.get(Branch, branch_id)
        if not row:
            return BranchResponse(success=False, message="Branch not found")
        return BranchResponse(success=True, message="OK", branch=_row_to_type(row))


# ── Mutation ──────────────────────────────────────────────────────────────────

@strawberry.type
class BranchMutation:
    @strawberry.field
    async def create_branch(self, info: Info, input: BranchCreateInput) -> BranchResponse:
        _require_admin(info)
        async with AsyncSessionLocal() as session:
            # Check unique code
            existing = await session.execute(
                select(Branch).where(Branch.code == input.code.upper())
            )
            if existing.scalar_one_or_none():
                return BranchResponse(success=False, message=f"Branch code '{input.code}' already exists")
            branch = Branch(
                code=input.code.upper(),
                name=input.name,
                address=input.address,
                city=input.city,
                contact_number=input.contact_number,
            )
            session.add(branch)
            await session.commit()
            await session.refresh(branch)
        return BranchResponse(success=True, message="Branch created", branch=_row_to_type(branch))

    @strawberry.field
    async def update_branch(self, info: Info, branch_id: int, input: BranchUpdateInput) -> BranchResponse:
        _require_admin(info)
        async with AsyncSessionLocal() as session:
            row = await session.get(Branch, branch_id)
            if not row:
                return BranchResponse(success=False, message="Branch not found")
            if input.name is not None:
                row.name = input.name
            if input.address is not None:
                row.address = input.address
            if input.city is not None:
                row.city = input.city
            if input.contact_number is not None:
                row.contact_number = input.contact_number
            if input.is_active is not None:
                row.is_active = input.is_active
            await session.commit()
            await session.refresh(row)
        return BranchResponse(success=True, message="Branch updated", branch=_row_to_type(row))

    @strawberry.field
    async def delete_branch(self, info: Info, branch_id: int) -> BranchResponse:
        _require_admin(info)
        async with AsyncSessionLocal() as session:
            row = await session.get(Branch, branch_id)
            if not row:
                return BranchResponse(success=False, message="Branch not found")
            await session.delete(row)
            await session.commit()
        return BranchResponse(success=True, message="Branch deleted")
