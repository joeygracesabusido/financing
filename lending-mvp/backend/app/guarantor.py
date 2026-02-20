"""
GraphQL types, queries, and mutations for Loan Guarantor management.
Phase 2.2 — Co-maker / Guarantor Support
"""
import strawberry
from typing import List, Optional
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status
from sqlalchemy.future import select

from .models import UserInDB
from .database.pg_models import get_db_session
from .database.pg_loan_models import LoanGuarantor, LoanApplication
from .database.customer_crud import CustomerCRUD
from .database import get_customers_collection


@strawberry.type
class GuarantorType:
    id: strawberry.ID
    loan_id: int
    customer_id: str
    created_at: datetime

    @strawberry.field
    async def guarantor_name(self) -> Optional[str]:
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            customer_data = await customer_crud.get_customer_by_id(self.customer_id)
            if customer_data:
                return customer_data.display_name
            return "N/A"
        except Exception:
            return "N/A"


@strawberry.input
class GuarantorCreateInput:
    loan_id: int
    customer_id: str   # Mongo customer ID of the guarantor


@strawberry.type
class GuarantorResponse:
    success: bool
    message: str
    guarantor: Optional[GuarantorType] = None


@strawberry.type
class GuarantorsResponse:
    success: bool
    message: str
    guarantors: List[GuarantorType]


def _db_to_type(g: LoanGuarantor) -> GuarantorType:
    return GuarantorType(
        id=strawberry.ID(str(g.id)),
        loan_id=g.loan_id,
        customer_id=g.customer_id,
        created_at=g.created_at,
    )


@strawberry.type
class GuarantorQuery:
    @strawberry.field
    async def loan_guarantors(self, info: Info, loan_id: int) -> GuarantorsResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        async for session in get_db_session():
            result = await session.execute(
                select(LoanGuarantor).filter(LoanGuarantor.loan_id == loan_id).order_by(LoanGuarantor.id)
            )
            items = result.scalars().all()
            return GuarantorsResponse(success=True, message="OK", guarantors=[_db_to_type(g) for g in items])


@strawberry.type
class GuarantorMutation:
    @strawberry.mutation
    async def add_guarantor(self, info: Info, input: GuarantorCreateInput) -> GuarantorResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            # Verify loan exists
            loan_result = await session.execute(select(LoanApplication).filter(LoanApplication.id == input.loan_id))
            if not loan_result.scalar_one_or_none():
                return GuarantorResponse(success=False, message="Loan not found")

            # Verify guarantor customer exists
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            customer = await customer_crud.get_customer_by_id(input.customer_id)
            if not customer:
                return GuarantorResponse(success=False, message="Guarantor customer not found")

            # Check not already guarantor
            existing = await session.execute(
                select(LoanGuarantor)
                .filter(LoanGuarantor.loan_id == input.loan_id)
                .filter(LoanGuarantor.customer_id == input.customer_id)
            )
            if existing.scalar_one_or_none():
                return GuarantorResponse(success=False, message="Customer is already a guarantor for this loan")

            new = LoanGuarantor(
                loan_id=input.loan_id,
                customer_id=input.customer_id,
            )
            session.add(new)
            await session.flush()
            await session.refresh(new)
            return GuarantorResponse(success=True, message="Guarantor added", guarantor=_db_to_type(new))

    @strawberry.mutation
    async def remove_guarantor(self, info: Info, id: strawberry.ID) -> GuarantorResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            result = await session.execute(select(LoanGuarantor).filter(LoanGuarantor.id == int(id)))
            item = result.scalar_one_or_none()
            if not item:
                return GuarantorResponse(success=False, message="Guarantor not found")
            await session.delete(item)
            return GuarantorResponse(success=True, message="Guarantor removed")
