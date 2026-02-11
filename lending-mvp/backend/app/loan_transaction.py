import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status

from .basemodel.loan_transaction_model import LoanTransaction, LoanTransactionBase
from .models import PyObjectId, UserInDB
from .database import get_loan_transactions_collection
from .database.loan_transaction_crud import LoanTransactionCRUD


# Loan Transaction Types (Strawberry)
@strawberry.type
class LoanTransactionType:
    id: strawberry.ID
    loan_id: strawberry.ID
    transaction_type: str
    amount: Decimal
    transaction_date: datetime
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

@strawberry.input
class LoanTransactionCreateInput:
    loan_id: strawberry.ID
    transaction_type: str
    amount: Decimal
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None

@strawberry.input
class LoanTransactionUpdateInput:
    transaction_type: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None

@strawberry.type
class LoanTransactionResponse:
    success: bool
    message: str
    transaction: Optional[LoanTransactionType] = None

@strawberry.type
class LoanTransactionsResponse:
    success: bool
    message: str
    transactions: List[LoanTransactionType]
    total: int

def convert_loan_transaction_db_to_loan_transaction_type(transaction_db: LoanTransaction) -> LoanTransactionType:
    """Convert LoanTransaction (from CRUD) to LoanTransactionType (Strawberry schema)"""
    return LoanTransactionType(
        id=strawberry.ID(str(transaction_db.id)),
        loan_id=strawberry.ID(str(transaction_db.loan_id)),
        transaction_type=transaction_db.transaction_type,
        amount=transaction_db.amount,
        transaction_date=transaction_db.transaction_date,
        notes=transaction_db.notes,
        created_at=transaction_db.created_at,
        updated_at=transaction_db.updated_at
    )

@strawberry.type
class LoanTransactionQuery:
    @strawberry.field
    async def loan_transaction(self, info: Info, transaction_id: strawberry.ID) -> LoanTransactionResponse:
        """Get a single loan transaction by ID"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            transaction_db = await transaction_crud.get_loan_transaction_by_id(str(transaction_id))

            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            # TODO: Add authorization check based on loan_id and current_user
            
            transaction_type = convert_loan_transaction_db_to_loan_transaction_type(transaction_db)
            return LoanTransactionResponse(success=True, message="Loan transaction retrieved successfully", transaction=transaction_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error retrieving loan transaction: {str(e)}")

    @strawberry.field
    async def loan_transactions(
        self,
        info: Info,
        skip: int = 0,
        limit: int = 100,
        loan_id: Optional[strawberry.ID] = None
    ) -> LoanTransactionsResponse:
        """Get a list of loan transactions with optional filtering by loan_id"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            
            # TODO: Add authorization check based on loan_id and current_user
            
            transactions_db = await transaction_crud.get_loan_transactions(skip=skip, limit=limit, loan_id=str(loan_id) if loan_id else None)
            total = await transaction_crud.count_loan_transactions(loan_id=str(loan_id) if loan_id else None)

            transactions_type = [convert_loan_transaction_db_to_loan_transaction_type(t) for t in transactions_db]
            return LoanTransactionsResponse(
                success=True,
                message="Loan transactions retrieved successfully",
                transactions=transactions_type,
                total=total
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionsResponse(success=False, message=f"Error retrieving loan transactions: {str(e)}", transactions=[], total=0)


@strawberry.type
class LoanTransactionMutation:
    @strawberry.mutation
    async def create_loan_transaction(self, info: Info, input: LoanTransactionCreateInput) -> LoanTransactionResponse:
        """Create a new loan transaction"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create loan transactions")

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)

            loan_transaction_base = LoanTransactionBase(
                loan_id=PyObjectId(str(input.loan_id)),
                transaction_type=input.transaction_type,
                amount=input.amount,
                transaction_date=input.transaction_date if input.transaction_date else datetime.utcnow(),
                notes=input.notes
            )
            
            transaction_db = await transaction_crud.create_loan_transaction(loan_transaction_base)
            transaction_type = convert_loan_transaction_db_to_loan_transaction_type(transaction_db)
            return LoanTransactionResponse(success=True, message="Loan transaction created successfully", transaction=transaction_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error creating loan transaction: {str(e)}")

    @strawberry.mutation
    async def update_loan_transaction(self, info: Info, transaction_id: strawberry.ID, input: LoanTransactionUpdateInput) -> LoanTransactionResponse:
        """Update an existing loan transaction"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update loan transactions")

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)

            update_data = input.model_dump(exclude_unset=True)
            
            transaction_db = await transaction_crud.update_loan_transaction(str(transaction_id), update_data)
            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            transaction_type = convert_loan_transaction_db_to_loan_transaction_type(transaction_db)
            return LoanTransactionResponse(success=True, message="Loan transaction updated successfully", transaction=transaction_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error updating loan transaction: {str(e)}")

    @strawberry.mutation
    async def delete_loan_transaction(self, info: Info, transaction_id: strawberry.ID) -> LoanTransactionResponse:
        """Delete a loan transaction"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete loan transactions")

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            
            success = await transaction_crud.delete_loan_transaction(str(transaction_id))
            if not success:
                return LoanTransactionResponse(success=False, message="Loan transaction not found or could not be deleted")
            
            return LoanTransactionResponse(success=True, message="Loan transaction deleted successfully")
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error deleting loan transaction: {str(e)}")
