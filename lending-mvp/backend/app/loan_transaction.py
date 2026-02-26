import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status

from .basemodel.loan_transaction_model import LoanTransaction, LoanTransactionBase
from .models import UserInDB
from .database import get_loan_transactions_collection
from .database.loan_transaction_crud import LoanTransactionCRUD


# Loan Transaction Types (Strawberry)
@strawberry.type
class LoanTransactionType:
    id: strawberry.ID
    loan_id: strawberry.ID = strawberry.field(name="loanId")
    transaction_type: str = strawberry.field(name="transactionType")
    amount: Decimal
    transaction_date: datetime = strawberry.field(name="transactionDate")
    notes: Optional[str]
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")

    # Additional fields
    commercial_bank: Optional[str] = strawberry.field(name="commercialBank")
    servicing_branch: Optional[str] = strawberry.field(name="servicingBranch")
    region: Optional[str] = strawberry.field(name="region")
    
    # Internal field to store the name from DB
    _borrower_name: strawberry.Private[Optional[str]]

    @strawberry.field(name="borrowerName")
    async def borrower_name(self, info: Info) -> Optional[str]:
        if self._borrower_name:
            return self._borrower_name
        
        # If borrower_name is missing, try to resolve it from the loan -> customer
        try:
            from .database import get_loans_collection, get_customers_collection
            from .database.loan_crud import LoanCRUD
            from .database.customer_crud import CustomerCRUD
            
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            loan_db = await loan_crud.get_loan_by_id(str(self.loan_id))
            
            if loan_db:
                customers_collection = get_customers_collection()
                customer_crud = CustomerCRUD(customers_collection)
                customer_db = await customer_crud.get_customer_by_id(str(loan_db.borrower_id))
                if customer_db:
                    return customer_db.display_name
        except Exception as e:
            print(f"Error resolving borrower name for transaction {self.id}: {e}")
        
        return "N/A"

    loan_product: Optional[str] = strawberry.field(name="loanProduct")
    reference_number: Optional[str] = strawberry.field(name="referenceNumber")
    debit_account: Optional[str] = strawberry.field(name="debitAccount")
    credit_account: Optional[str] = strawberry.field(name="creditAccount")
    disbursement_method: Optional[str] = strawberry.field(name="disbursementMethod")
    disbursement_status: Optional[str] = strawberry.field(name="disbursementStatus")
    cheque_number: Optional[str] = strawberry.field(name="chequeNumber")
    beneficiary_bank: Optional[str] = strawberry.field(name="beneficiaryBank")
    beneficiary_account: Optional[str] = strawberry.field(name="beneficiaryAccount")
    approved_by: Optional[str] = strawberry.field(name="approvedBy")
    processed_by: Optional[str] = strawberry.field(name="processedBy")

@strawberry.input
class LoanTransactionCreateInput:
    loan_id: strawberry.ID
    transaction_type: str
    amount: Decimal
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None
    commercial_bank: Optional[str] = None
    servicing_branch: Optional[str] = None
    region: Optional[str] = None
    borrower_name: Optional[str] = None
    loan_product: Optional[str] = None
    reference_number: Optional[str] = None
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    disbursement_method: Optional[str] = None
    disbursement_status: Optional[str] = "pending"
    cheque_number: Optional[str] = None
    beneficiary_bank: Optional[str] = None
    beneficiary_account: Optional[str] = None
    approved_by: Optional[str] = None
    processed_by: Optional[str] = None

@strawberry.input
class LoanTransactionUpdateInput:
    transaction_type: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None
    commercial_bank: Optional[str] = None
    servicing_branch: Optional[str] = None
    region: Optional[str] = None
    borrower_name: Optional[str] = None
    loan_product: Optional[str] = None
    reference_number: Optional[str] = None
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    disbursement_method: Optional[str] = None
    disbursement_status: Optional[str] = None
    cheque_number: Optional[str] = None
    beneficiary_bank: Optional[str] = None
    beneficiary_account: Optional[str] = None
    approved_by: Optional[str] = None
    processed_by: Optional[str] = None

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
        updated_at=transaction_db.updated_at,
        commercial_bank=transaction_db.commercial_bank,
        servicing_branch=transaction_db.servicing_branch,
        region=transaction_db.region,
        _borrower_name=transaction_db.borrower_name,
        loan_product=transaction_db.loan_product,
        reference_number=transaction_db.reference_number,
        debit_account=transaction_db.debit_account,
        credit_account=transaction_db.credit_account,
        disbursement_method=transaction_db.disbursement_method,
        disbursement_status=transaction_db.disbursement_status,
        cheque_number=transaction_db.cheque_number,
        beneficiary_bank=transaction_db.beneficiary_bank,
        beneficiary_account=transaction_db.beneficiary_account,
        approved_by=transaction_db.approved_by,
        processed_by=transaction_db.processed_by
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
            
            if current_user.role == "staff":
                from .database import get_loans_collection
                from .database.loan_crud import LoanCRUD
                loans_collection = get_loans_collection()
                loan_crud = LoanCRUD(loans_collection)
                loan_db = await loan_crud.get_loan_by_id(str(transaction_db.loan_id))
                if loan_db and loan_db.borrower_id != current_user.id:
                    return LoanTransactionResponse(success=False, message="Not authorized to access this loan transaction")
            
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
            
            if current_user.role == "staff" and loan_id:
                from .database import get_loans_collection
                from .database.loan_crud import LoanCRUD
                loans_collection = get_loans_collection()
                loan_crud = LoanCRUD(loans_collection)
                loan_db = await loan_crud.get_loan_by_id(str(loan_id))
                if loan_db and loan_db.borrower_id != current_user.id:
                    return LoanTransactionsResponse(success=False, message="Not authorized to access this loan's transactions", transactions=[], total=0)
            
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
                loan_id=str(input.loan_id),
                transaction_type=input.transaction_type,
                amount=input.amount,
                transaction_date=input.transaction_date if input.transaction_date else datetime.utcnow(),
                notes=input.notes,
                commercial_bank=input.commercial_bank,
                servicing_branch=input.servicing_branch,
                region=input.region,
                borrower_name=input.borrower_name,
                loan_product=input.loan_product,
                reference_number=input.reference_number,
                debit_account=input.debit_account,
                credit_account=input.credit_account,
                disbursement_method=input.disbursement_method,
                disbursement_status=input.disbursement_status,
                cheque_number=input.cheque_number,
                beneficiary_bank=input.beneficiary_bank,
                beneficiary_account=input.beneficiary_account,
                approved_by=input.approved_by,
                processed_by=input.processed_by
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

            # Convert Strawberry input object to dictionary and remove None values
            # Also convert Decimal to float for MongoDB compatibility
            update_data = {k: (float(v) if isinstance(v, Decimal) else v) 
                           for k, v in strawberry.asdict(input).items() if v is not None}
            
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
