"""
GraphQL types, queries, and mutations for Loan Collateral management.
Phase 2.2 — Collateral Management
"""
import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status
from sqlalchemy.future import select

from .models import UserInDB
from .database.pg_models import get_db_session
from .database.pg_loan_models import LoanCollateral, LoanApplication


@strawberry.type
class CollateralType:
    id: strawberry.ID
    loan_id: int
    type: str           # vehicle | real_estate | deposit | jewelry | equipment | other
    value: Decimal
    description: Optional[str]
    created_at: datetime


@strawberry.input
class CollateralCreateInput:
    loan_id: int
    type: str
    value: Decimal
    description: Optional[str] = None


@strawberry.type
class CollateralResponse:
    success: bool
    message: str
    collateral: Optional[CollateralType] = None


@strawberry.type
class CollateralsResponse:
    success: bool
    message: str
    collaterals: List[CollateralType]
    total_value: Decimal


def _db_to_type(c: LoanCollateral) -> CollateralType:
    return CollateralType(
        id=strawberry.ID(str(c.id)),
        loan_id=c.loan_id,
        type=c.type,
        value=c.value,
        description=c.description,
        created_at=c.created_at,
    )


@strawberry.type
class CollateralQuery:
    @strawberry.field
    async def loan_collateral(self, info: Info, loan_id: int) -> CollateralsResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        async for session in get_db_session():
            result = await session.execute(
                select(LoanCollateral).filter(LoanCollateral.loan_id == loan_id).order_by(LoanCollateral.id)
            )
            items = result.scalars().all()
            collaterals = [_db_to_type(c) for c in items]
            total_value = sum(c.value for c in collaterals) if collaterals else Decimal(0)
            return CollateralsResponse(success=True, message="OK", collaterals=collaterals, total_value=total_value)


@strawberry.type
class CollateralMutation:
    @strawberry.mutation
    async def add_collateral(self, info: Info, input: CollateralCreateInput) -> CollateralResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            # Verify loan exists
            loan_result = await session.execute(select(LoanApplication).filter(LoanApplication.id == input.loan_id))
            if not loan_result.scalar_one_or_none():
                return CollateralResponse(success=False, message="Loan not found")

            new = LoanCollateral(
                loan_id=input.loan_id,
                type=input.type,
                value=input.value,
                description=input.description,
            )
            session.add(new)
            await session.flush()
            await session.refresh(new)
            return CollateralResponse(success=True, message="Collateral added", collateral=_db_to_type(new))

    @strawberry.mutation
    async def remove_collateral(self, info: Info, id: strawberry.ID) -> CollateralResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            result = await session.execute(select(LoanCollateral).filter(LoanCollateral.id == int(id)))
            item = result.scalar_one_or_none()
            if not item:
                return CollateralResponse(success=False, message="Collateral not found")
            await session.delete(item)
            return CollateralResponse(success=True, message="Collateral removed")
