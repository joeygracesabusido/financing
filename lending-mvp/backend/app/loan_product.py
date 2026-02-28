import strawberry
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.future import select
from .database.postgres import get_db_session
from .database.pg_loan_models import PGLoanProduct


def _db_to_type(obj: PGLoanProduct) -> "LoanProductType":
    return LoanProductType(
        id=strawberry.ID(str(obj.id)),
        product_code=obj.product_code,
        name=obj.name,
        description=obj.description,
        amortization_type=obj.amortization_type,
        repayment_frequency=obj.repayment_frequency,
        interest_rate=obj.interest_rate,
        penalty_rate=obj.penalty_rate,
        grace_period_months=obj.grace_period_months,
        is_active=obj.is_active,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
        # Phase 2.1 enhanced fields
        principal_only_grace=obj.principal_only_grace,
        full_grace=obj.full_grace,
        origination_fee_rate=obj.origination_fee_rate,
        origination_fee_type=obj.origination_fee_type,
        prepayment_allowed=obj.prepayment_allowed,
        prepayment_penalty_rate=obj.prepayment_penalty_rate,
        customer_loan_limit=obj.customer_loan_limit,
    )


@strawberry.type
class LoanProductType:
    id: strawberry.ID
    product_code: str = strawberry.field(name="productCode")
    name: str
    description: Optional[str]
    amortization_type: str = strawberry.field(name="amortizationType")
    repayment_frequency: str = strawberry.field(name="repaymentFrequency")
    interest_rate: Decimal = strawberry.field(name="interestRate")
    penalty_rate: Decimal = strawberry.field(name="penaltyRate")
    grace_period_months: int = strawberry.field(name="gracePeriodMonths")
    is_active: bool = strawberry.field(name="isActive")
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")
    # Phase 2.1
    principal_only_grace: bool = strawberry.field(name="principalOnlyGrace", default=False)
    full_grace: bool = strawberry.field(name="fullGrace", default=False)
    origination_fee_rate: Optional[Decimal] = strawberry.field(name="originationFeeRate", default=None)
    origination_fee_type: Optional[str] = strawberry.field(name="originationFeeType", default=None)       # "upfront" | "spread"
    prepayment_allowed: bool = strawberry.field(name="prepaymentAllowed", default=True)
    prepayment_penalty_rate: Optional[Decimal] = strawberry.field(name="prepaymentPenaltyRate", default=None)
    customer_loan_limit: Optional[Decimal] = strawberry.field(name="customerLoanLimit", default=None)


@strawberry.input
class LoanProductCreateInput:
    product_code: str = strawberry.field(name="productCode")
    name: str
    amortization_type: str = strawberry.field(name="amortizationType")      # flat_rate | declining_balance | balloon_payment | interest_only
    repayment_frequency: str = strawberry.field(name="repaymentFrequency")    # daily | weekly | bi_weekly | monthly | quarterly | bullet
    interest_rate: Decimal = strawberry.field(name="interestRate")
    description: Optional[str] = None
    penalty_rate: Decimal = strawberry.field(name="penaltyRate", default=Decimal("0.0"))
    grace_period_months: int = strawberry.field(name="gracePeriodMonths", default=0)
    is_active: bool = strawberry.field(name="isActive", default=True)
    # Phase 2.1
    principal_only_grace: bool = strawberry.field(name="principalOnlyGrace", default=False)
    full_grace: bool = strawberry.field(name="fullGrace", default=False)
    origination_fee_rate: Optional[Decimal] = strawberry.field(name="originationFeeRate", default=None)
    origination_fee_type: Optional[str] = strawberry.field(name="originationFeeType", default=None)
    prepayment_allowed: bool = strawberry.field(name="prepaymentAllowed", default=True)
    prepayment_penalty_rate: Optional[Decimal] = strawberry.field(name="prepaymentPenaltyRate", default=None)
    customer_loan_limit: Optional[Decimal] = strawberry.field(name="customerLoanLimit", default=None)


@strawberry.input
class LoanProductUpdateInput:
    product_code: Optional[str] = strawberry.field(name="productCode", default=None)
    name: Optional[str] = None
    description: Optional[str] = None
    amortization_type: Optional[str] = strawberry.field(name="amortizationType", default=None)
    repayment_frequency: Optional[str] = strawberry.field(name="repaymentFrequency", default=None)
    interest_rate: Optional[Decimal] = strawberry.field(name="interestRate", default=None)
    penalty_rate: Optional[Decimal] = strawberry.field(name="penaltyRate", default=None)
    grace_period_months: Optional[int] = strawberry.field(name="gracePeriodMonths", default=None)
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)
    # Phase 2.1
    principal_only_grace: Optional[bool] = strawberry.field(name="principalOnlyGrace", default=None)
    full_grace: Optional[bool] = strawberry.field(name="fullGrace", default=None)
    origination_fee_rate: Optional[Decimal] = strawberry.field(name="originationFeeRate", default=None)
    origination_fee_type: Optional[str] = strawberry.field(name="originationFeeType", default=None)
    prepayment_allowed: Optional[bool] = strawberry.field(name="prepaymentAllowed", default=None)
    prepayment_penalty_rate: Optional[Decimal] = strawberry.field(name="prepaymentPenaltyRate", default=None)
    customer_loan_limit: Optional[Decimal] = strawberry.field(name="customerLoanLimit", default=None)


@strawberry.type
class LoanProductQuery:
    @strawberry.field
    async def loan_product(self, id: strawberry.ID) -> Optional[LoanProductType]:
        async for session in get_db_session():
            result = await session.execute(select(PGLoanProduct).filter(PGLoanProduct.id == int(id)))
            db_obj = result.scalar_one_or_none()
            if db_obj:
                return _db_to_type(db_obj)
            return None

    @strawberry.field
    async def loan_products(self) -> List[LoanProductType]:
        async for session in get_db_session():
            result = await session.execute(select(PGLoanProduct).order_by(PGLoanProduct.id))
            items = result.scalars().all()
            return [_db_to_type(obj) for obj in items]


@strawberry.type
class LoanProductMutation:
    @strawberry.mutation
    async def create_loan_product(self, input: LoanProductCreateInput) -> LoanProductType:
        async for session in get_db_session():
            new_prod = PGLoanProduct(
                product_code=input.product_code,
                name=input.name,
                description=input.description,
                amortization_type=input.amortization_type,
                repayment_frequency=input.repayment_frequency,
                interest_rate=input.interest_rate,
                penalty_rate=input.penalty_rate,
                grace_period_months=input.grace_period_months,
                is_active=input.is_active,
                principal_only_grace=input.principal_only_grace,
                full_grace=input.full_grace,
                origination_fee_rate=input.origination_fee_rate,
                origination_fee_type=input.origination_fee_type,
                prepayment_allowed=input.prepayment_allowed,
                prepayment_penalty_rate=input.prepayment_penalty_rate,
                customer_loan_limit=input.customer_loan_limit,
            )
            session.add(new_prod)
            await session.commit()
            await session.refresh(new_prod)
            return _db_to_type(new_prod)

    @strawberry.mutation
    async def update_loan_product(self, id: strawberry.ID, input: LoanProductUpdateInput) -> Optional[LoanProductType]:
        async for session in get_db_session():
            result = await session.execute(select(PGLoanProduct).filter(PGLoanProduct.id == int(id)))
            obj = result.scalar_one_or_none()
            if not obj:
                return None

            update_data = {k: v for k, v in vars(input).items() if v is not None}
            for key, value in update_data.items():
                setattr(obj, key, value)

            await session.commit()
            await session.refresh(obj)
            return _db_to_type(obj)

    @strawberry.mutation
    async def delete_loan_product(self, id: strawberry.ID) -> bool:
        async for session in get_db_session():
            result = await session.execute(select(PGLoanProduct).filter(PGLoanProduct.id == int(id)))
            obj = result.scalar_one_or_none()
            if obj:
                await session.delete(obj)
                await session.commit()
                return True
            return False
