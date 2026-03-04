"""
GraphQL server for Lending MVP using Strawberry
"""

import strawberry
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_async_session_local
from .database.pg_core_models import User, Customer, SavingsAccount, Loan

@strawberry.type
class Health:
    status: str
    message: str

@strawberry.type
class DashboardStats:
    customersTotal: int
    loansTotal: int

@strawberry.type
class UserNode:
    id: str
    email: str
    username: str
    fullName: str
    isActive: bool
    role: str

@strawberry.type
class SavingsAccountNode:
    id: str
    accountNumber: str
    balance: float

@strawberry.type
class LoanNode:
    id: str
    principal: float
    status: str

@strawberry.type
class Query:
    @strawberry.field
    async def users(self, skip: int = 0, limit: int = 100) -> List[UserNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(User).offset(skip).limit(limit)
            )
            users = result.scalars().all()
            return [
                UserNode(
                    id=str(u.uuid if u.uuid is not None else u.id),
                    email=u.email,
                    username=u.username,
                    fullName=u.full_name,
                    isActive=u.is_active,
                    role=u.role,
                )
                for u in users
            ]

    @strawberry.field
    async def health(self) -> Health:
        return Health(status="ok", message="Lending MVP GraphQL API is running")

    @strawberry.field
    async def dashboardStats(self) -> DashboardStats:
        # Return mock data for development
        return DashboardStats(
            customersTotal=150,
            loansTotal=85,
        )

schema = strawberry.Schema(query=Query)