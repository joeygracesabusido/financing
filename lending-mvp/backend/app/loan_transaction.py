import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status
import json

from .basemodel.loan_transaction_model import LoanTransaction, LoanTransactionBase
from .models import UserInDB
from .database import get_loan_transactions_collection
from .database.loan_transaction_crud import LoanTransactionCRUD

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return str(obj)
    raise TypeError ("Type %s not serializable" % type(obj))

# Loan Transaction Types (Strawberry)
@strawberry.type
class LoanTransactionType:
    id: strawberry.ID
    loan_id: strawberry.ID = strawberry.field(name="loanId")
    transaction_type: Optional[str] = strawberry.field(name="transactionType", default=None)
    amount: Optional[Decimal] = None
    transaction_date: Optional[datetime] = strawberry.field(name="transactionDate", default=None)
    notes: Optional[str] = None
    created_at: Optional[datetime] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[datetime] = strawberry.field(name="updatedAt", default=None)

    # Additional fields
    commercial_bank: Optional[str] = strawberry.field(name="commercialBank", default=None)
    servicing_branch: Optional[str] = strawberry.field(name="servicingBranch", default=None)
    region: Optional[str] = strawberry.field(name="region", default=None)
    loan_product: Optional[str] = strawberry.field(name="loanProduct", default=None)
    reference_number: Optional[str] = strawberry.field(name="referenceNumber", default=None)
    debit_account: Optional[str] = strawberry.field(name="debitAccount", default=None)
    credit_account: Optional[str] = strawberry.field(name="creditAccount", default=None)
    disbursement_method: Optional[str] = strawberry.field(name="disbursementMethod", default=None)
    disbursement_status: Optional[str] = strawberry.field(name="disbursementStatus", default=None)
    cheque_number: Optional[str] = strawberry.field(name="chequeNumber", default=None)
    beneficiary_bank: Optional[str] = strawberry.field(name="beneficiaryBank", default=None)
    beneficiary_account: Optional[str] = strawberry.field(name="beneficiaryAccount", default=None)
    approved_by: Optional[str] = strawberry.field(name="approvedBy", default=None)
    processed_by: Optional[str] = strawberry.field(name="processedBy", default=None)
    
    # Internal field to store the name from DB
    borrower_name: Optional[str] = strawberry.field(name="borrowerName", default="N/A")

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

def convert_db_to_transaction_type(db_obj: LoanTransaction) -> LoanTransactionType:
    data = db_obj.model_dump()
    # model_dump with by_alias=True was used in CRUD, but model_validate should handle either.
    # To be safe, we map fields manually.
    
    transaction_type = LoanTransactionType(
        id=strawberry.ID(str(db_obj.id)),
        loan_id=strawberry.ID(str(db_obj.loan_id)),
        transaction_type=db_obj.transaction_type,
        amount=db_obj.amount,
        transaction_date=db_obj.transaction_date,
        notes=db_obj.notes,
        created_at=db_obj.created_at,
        updated_at=db_obj.updated_at,
        commercial_bank=db_obj.commercial_bank,
        servicing_branch=db_obj.servicing_branch,
        region=db_obj.region,
        loan_product=db_obj.loan_product,
        reference_number=db_obj.reference_number,
        debit_account=db_obj.debit_account,
        credit_account=db_obj.credit_account,
        disbursement_method=db_obj.disbursement_method,
        disbursement_status=db_obj.disbursement_status,
        cheque_number=db_obj.cheque_number,
        beneficiary_bank=db_obj.beneficiary_bank,
        beneficiary_account=db_obj.beneficiary_account,
        approved_by=db_obj.approved_by,
        processed_by=db_obj.processed_by,
        borrower_name=db_obj.borrower_name or "N/A"
    )
    return transaction_type

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

        redis = info.context.get("request").app.state.redis
        cache_key = f"loan_transaction:{transaction_id}"
        
        # Skip caching for now due to async method serialization issues
        # if redis:
        #     cached = redis.get(cache_key)
        #     if cached:
        #         print(f"--- Cache hit for {cache_key} ---")
        #         data = json.loads(cached)
        #         
        #         # Convert back types
        #         if data.get('amount'): data['amount'] = Decimal(str(data['amount']))
        #         if data.get('transaction_date'): data['transaction_date'] = datetime.fromisoformat(data['transaction_date'])
        #         if data.get('created_at'): data['created_at'] = datetime.fromisoformat(data['created_at'])
        #         if data.get('updated_at'): data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        #         
        #         borrower_name = data.get('_borrower_name')
        #         
        #         # Filter for constructor
        #         allowed_keys = {
        #             'id', 'loan_id', 'transaction_type', 'amount', 'transaction_date', 'notes',
        #             'created_at', 'updated_at', 'commercial_bank', 'servicing_branch', 'region',
        #             'loan_product', 'reference_number', 'debit_account', 'credit_account',
        #             'disbursement_method', 'disbursement_status', 'cheque_number',
        #             'beneficiary_bank', 'beneficiary_account', 'approved_by', 'processed_by'
        #         }
        #         
        #         final_data = {k: v for k, v in data.items() if k in allowed_keys}
        #         
        #         obj = LoanTransactionType(**final_data)
        #         obj._borrower_name = borrower_name
        #         return LoanTransactionResponse(success=True, message="Loan transaction retrieved from cache", transaction=obj)

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            transaction_db = await transaction_crud.get_loan_transaction_by_id(str(transaction_id))

            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            # Skip caching for now due to async method serialization issues
            # if redis:
            #     redis.setex(cache_key, 3600, json.dumps(strawberry.asdict(transaction_type), default=json_serial))

            return LoanTransactionResponse(success=True, message="Loan transaction retrieved successfully", transaction=transaction_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in loan_transaction query: {e}")
            return LoanTransactionResponse(success=False, message=f"Error retrieving loan transaction: {str(e)}")

    @strawberry.field
    async def loan_transactions(
        self,
        info: Info,
        skip: int = 0,
        limit: int = 100,
        loan_id: Optional[strawberry.ID] = None,
        search_term: Optional[str] = None
    ) -> LoanTransactionsResponse:
        """Get a list of loan transactions with optional filtering by loan_id or search_term"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        redis = info.context.get("request").app.state.redis
        cache_key = f"loan_transactions:list:{skip}:{limit}:{loan_id}:{search_term}"
        
        # Skip caching for now due to async method serialization issues
        # if redis:
        #     cached = redis.get(cache_key)
        #     if cached:
        #         print(f"--- Cache hit for {cache_key} ---")
        #         cache_data = json.loads(cached)
        #         transactions = []
        #         
        #         allowed_keys = {
        #             'id', 'loan_id', 'transaction_type', 'amount', 'transaction_date', 'notes',
        #             'created_at', 'updated_at', 'commercial_bank', 'servicing_branch', 'region',
        #             'loan_product', 'reference_number', 'debit_account', 'credit_account',
        #             'disbursement_method', 'disbursement_status', 'cheque_number',
        #             'beneficiary_bank', 'beneficiary_account', 'approved_by', 'processed_by'
        #         }
        #
        #         for t in cache_data['transactions']:
        #             if t.get('amount'): t['amount'] = Decimal(str(t['amount']))
        #             if t.get('transaction_date'): t['transaction_date'] = datetime.fromisoformat(t['transaction_date'])
        #             if t.get('created_at'): t['created_at'] = datetime.fromisoformat(t['created_at'])
        #             if t.get('updated_at'): t['updated_at'] = datetime.fromisoformat(t['updated_at'])
        #             
        #             borrower_name = t.get('_borrower_name')
        #             final_t = {k: v for k, v in t.items() if k in allowed_keys}
        #                     
        #             obj = LoanTransactionType(**final_t)
        #             obj._borrower_name = borrower_name
        #             transactions.append(obj)
        #         return LoanTransactionsResponse(success=True, message="Loan transactions retrieved from cache", transactions=transactions, total=cache_data['total'])

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            
            transactions_db = await transaction_crud.get_loan_transactions(skip=skip, limit=limit, loan_id=str(loan_id) if loan_id else None, search_term=search_term)
            total = await transaction_crud.count_loan_transactions(loan_id=str(loan_id) if loan_id else None, search_term=search_term)

            transactions_type = [convert_db_to_transaction_type(t) for t in transactions_db]
            
            # Skip caching for now due to async method serialization issues
            # if redis:
            #     cache_data = {
            #         'total': total,
            #         'transactions': [strawberry.asdict(t) for t in transactions_type]
            #     }
            #     redis.setex(cache_key, 3600, json.dumps(cache_data, default=json_serial))

            return LoanTransactionsResponse(
                success=True,
                message="Loan transactions retrieved successfully",
                transactions=transactions_type,
                total=total
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in loan_transactions query: {e}")
            return LoanTransactionsResponse(success=False, message=f"Error retrieving loan transactions: {str(e)}", transactions=[], total=0)


@strawberry.type
class LoanTransactionMutation:
    async def _clear_loan_transaction_cache(self, redis, transaction_id=None):
        if not redis: return
        if transaction_id:
            redis.delete(f"loan_transaction:{transaction_id}")
        keys = redis.keys("loan_transactions:list:*")
        for key in keys:
            redis.delete(key)
        print(f"--- Cache cleared for loan transactions ---")

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
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            redis = info.context.get("request").app.state.redis
            await self._clear_loan_transaction_cache(redis)

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

            update_data = {k: (float(v) if isinstance(v, Decimal) else v) 
                           for k, v in strawberry.asdict(input).items() if v is not None}
            
            transaction_db = await transaction_crud.update_loan_transaction(str(transaction_id), update_data)
            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            redis = info.context.get("request").app.state.redis
            await self._clear_loan_transaction_cache(redis, transaction_id)

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
            
            redis = info.context.get("request").app.state.redis
            await self._clear_loan_transaction_cache(redis, transaction_id)

            return LoanTransactionResponse(success=True, message="Loan transaction deleted successfully")
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error deleting loan transaction: {str(e)}")
