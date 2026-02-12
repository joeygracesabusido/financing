import strawberry
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.basemodel.loan_product_model import (
    LoanProduct as PydanticLoanProduct,
    LoanProductCreate as PydanticLoanProductCreate,
    LoanProductUpdate as PydanticLoanProductUpdate,
    PyObjectId,
)
from app.database import loan_product_crud

@strawberry.type
class LoanProduct:
    id: str
    product_code: str
    product_name: str
    term_type: str
    gl_code: str
    type: str
    default_interest_rate: Decimal
    template: str
    security: str
    br_lc: str
    created_at: datetime
    updated_at: datetime

@strawberry.input
class LoanProductCreateInput:
    product_code: str
    product_name: str
    term_type: str
    gl_code: str
    type: str
    default_interest_rate: Decimal
    template: str
    security: str
    br_lc: str

@strawberry.input
class LoanProductUpdateInput:
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    term_type: Optional[str] = None
    gl_code: Optional[str] = None
    type: Optional[str] = None
    default_interest_rate: Optional[Decimal] = None
    template: Optional[str] = None
    security: Optional[str] = None
    br_lc: Optional[str] = None

@strawberry.type
class LoanProductQuery:
    @strawberry.field
    async def loan_product(self, id: str) -> Optional[LoanProduct]:
        loan_product_data = await loan_product_crud.get_loan_product_by_id(id)
        return LoanProduct(**loan_product_data.model_dump()) if loan_product_data else None

    @strawberry.field
    async def loan_products(self) -> List[LoanProduct]:
        loan_products_data = await loan_product_crud.get_all_loan_products()
        return [LoanProduct(**lp.model_dump()) for lp in loan_products_data]

@strawberry.type
class LoanProductMutation:
    @strawberry.mutation
    async def create_loan_product(self, input: LoanProductCreateInput) -> LoanProduct:
        loan_product_data = PydanticLoanProductCreate(**input.__dict__)
        new_loan_product = await loan_product_crud.create_loan_product(loan_product_data)
        return LoanProduct(**new_loan_product.model_dump())

    @strawberry.mutation
    async def update_loan_product(self, id: str, input: LoanProductUpdateInput) -> Optional[LoanProduct]:
        loan_product_data = PydanticLoanProductUpdate(**input.__dict__)
        updated_loan_product = await loan_product_crud.update_loan_product(id, loan_product_data)
        return LoanProduct(**updated_loan_product.model_dump()) if updated_loan_product else None

    @strawberry.mutation
    async def delete_loan_product(self, id: str) -> bool:
        return await loan_product_crud.delete_loan_product(id)
