"""
GraphQL server for Lending MVP using Strawberry
"""

import strawberry
from typing import List, Optional
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
    customers_total: int
    savings_total: float
    loans_total: int
    loans_active: int

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
        session_factory = get_async_session_local()
        async with session_factory() as session:
            # Count users
            user_result = await session.execute(select(User))
            total_users = len(user_result.scalars().all())
            
            # Count customers
            customer_result = await session.execute(select(Customer))
            total_customers = len(customer_result.scalars().all())
            
            # Count savings accounts
            savings_result = await session.execute(select(SavingsAccount))
            savings_accounts = savings_result.scalars().all()
            total_savings = sum(
                float(s.balance) for s in savings_accounts 
                if s.balance is not None
            )
            
            # Count loans
            loan_result = await session.execute(select(Loan))
            loans = loan_result.scalars().all()
            active_loans = len([l for l in loans if l.status == 'active'])
            
            return DashboardStats(
                customers_total=total_customers,
                savings_total=total_savings,
                loans_total=len(loans),
                loans_active=active_loans,
            )

schema = strawberry.Schema(query=Query)
