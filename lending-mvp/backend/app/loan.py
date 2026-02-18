import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status

from .basemodel.loan_model import Loan, LoanCreate, LoanUpdate, LoanOut, PyObjectId
from .models import UserInDB
from .database import get_loans_collection, get_db, get_customers_collection
from .database.loan_crud import LoanCRUD
from .database.customer_crud import CustomerCRUD
from .customer import CustomerType, convert_customer_db_to_customer_type


# Loan Types (Strawberry)
@strawberry.type
class LoanType:
    id: strawberry.ID
    borrower_id: strawberry.ID
    amount_requested: Decimal
    term_months: int
    interest_rate: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    async def customer(self, info: Info) -> Optional[CustomerType]:
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            customer_data = await customer_crud.get_customer_by_id(str(self.borrower_id))
            if customer_data:
                return convert_customer_db_to_customer_type(customer_data)
            return None
        except Exception as e:
            print(f"Error resolving customer for loan: {e}")
            return None

@strawberry.input
class LoanCreateInput:
    borrower_id: strawberry.ID
    amount_requested: Decimal
    term_months: int
    interest_rate: Decimal

@strawberry.input
class LoanUpdateInput:
    borrower_id: Optional[strawberry.ID] = None
    amount_requested: Optional[Decimal] = None
    term_months: Optional[int] = None
    interest_rate: Optional[Decimal] = None
    status: Optional[str] = None

@strawberry.type
class LoanResponse:
    success: bool
    message: str
    loan: Optional[LoanType] = None

@strawberry.type
class LoansResponse:
    success: bool
    message: str
    loans: List[LoanType]
    total: int

def convert_loan_db_to_loan_type(loan_db: Loan) -> LoanType:
    """Convert Loan (from CRUD) to LoanType (Strawberry schema)"""
    return LoanType(
        id=strawberry.ID(str(loan_db.id)),
        borrower_id=strawberry.ID(str(loan_db.borrower_id)),
        amount_requested=loan_db.amount_requested,
        term_months=loan_db.term_months,
        interest_rate=loan_db.interest_rate,
        status=loan_db.status,
        created_at=loan_db.created_at,
        updated_at=loan_db.updated_at
    )

@strawberry.type
class LoanQuery:
    @strawberry.field
    async def loan(self, info: Info, loan_id: strawberry.ID) -> LoanResponse:
        """Get a single loan by ID"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]: # Example role check
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            loan_db = await loan_crud.get_loan_by_id(str(loan_id))

            if not loan_db:
                return LoanResponse(success=False, message="Loan not found")
            
            # Additional authorization: check if the loan belongs to the current user (if not admin/staff)
            if current_user.role == "user" and str(loan_db.borrower_id) != str(current_user.id):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this loan")

            loan_type = convert_loan_db_to_loan_type(loan_db)
            return LoanResponse(success=True, message="Loan retrieved successfully", loan=loan_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error retrieving loan: {str(e)}")

    @strawberry.field
    async def loans(
        self,
        info: Info,
        skip: int = 0,
        limit: int = 100,
        borrower_id: Optional[strawberry.ID] = None
    ) -> LoansResponse:
        """Get a list of loans with optional filtering by borrower_id"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]: # Example role check
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            
            # If a regular user, they can only see their own loans
            if current_user.role == "user":
                borrower_id = strawberry.ID(str(current_user.id))

            loans_db = await loan_crud.get_loans(skip=skip, limit=limit, borrower_id=str(borrower_id) if borrower_id else None)
            total = await loan_crud.count_loans(borrower_id=str(borrower_id) if borrower_id else None)

            loans_type = [convert_loan_db_to_loan_type(loan_db) for loan_db in loans_db]
            return LoansResponse(
                success=True,
                message="Loans retrieved successfully",
                loans=loans_type,
                total=total
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoansResponse(success=False, message=f"Error retrieving loans: {str(e)}", loans=[], total=0)


@strawberry.type
class LoanMutation:
    @strawberry.mutation
    async def create_loan(self, info: Info, input: LoanCreateInput) -> LoanResponse:
        """Create a new loan application"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff", "user"]: # Even users can apply for loans
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create loans")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)

            # Ensure the borrower_id is either the current user's ID or, for admin/staff, explicitly provided
            if current_user.role == "user":
                if str(input.borrower_id) != str(current_user.id):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Users can only create loans for themselves.")
            
            loan_create = LoanCreate(
                borrower_id=PyObjectId(str(input.borrower_id)),
                amount_requested=input.amount_requested,
                term_months=input.term_months,
                interest_rate=input.interest_rate
            )
            
            loan_db = await loan_crud.create_loan(loan_create)
            loan_type = convert_loan_db_to_loan_type(loan_db)
            return LoanResponse(success=True, message="Loan application created successfully", loan=loan_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error creating loan: {str(e)}")

    @strawberry.mutation
    async def update_loan(self, info: Info, loan_id: strawberry.ID, input: LoanUpdateInput) -> LoanResponse:
        """Update an existing loan's details"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        # Only admin/staff can update loans for now, or potentially the borrower for certain fields
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update loans")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)

            loan_update_data = input.model_dump(exclude_unset=True)
            if "borrower_id" in loan_update_data and loan_update_data["borrower_id"] is not None:
                loan_update_data["borrower_id"] = PyObjectId(str(loan_update_data["borrower_id"]))

            loan_update = LoanUpdate(**loan_update_data)
            
            loan_db = await loan_crud.update_loan(str(loan_id), loan_update)
            if not loan_db:
                return LoanResponse(success=False, message="Loan not found")
            
            loan_type = convert_loan_db_to_loan_type(loan_db)
            return LoanResponse(success=True, message="Loan updated successfully", loan=loan_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error updating loan: {str(e)}")

    @strawberry.mutation
    async def delete_loan(self, info: Info, loan_id: strawberry.ID) -> LoanResponse:
        """Delete a loan application"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        # Only admin/staff can delete loans, or potentially the borrower if the loan is still pending
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete loans")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            
            # Optional: Add logic to prevent deletion of active/approved loans
            loan_db = await loan_crud.get_loan_by_id(str(loan_id))
            if loan_db and loan_db.status != "pending" and current_user.role != "admin":
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only pending loans can be deleted by non-admins.")


            success = await loan_crud.delete_loan(str(loan_id))
            if not success:
                return LoanResponse(success=False, message="Loan not found or could not be deleted")
            
            return LoanResponse(success=True, message="Loan deleted successfully")
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error deleting loan: {str(e)}")
