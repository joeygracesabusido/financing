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
from .loan_product import LoanProduct, convert_lp_db_to_type
from .database import loan_product_crud
from .database import get_loans_collection
from .database.loan_crud import LoanCRUD

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return str(obj)
    if hasattr(obj, '__str__'):
        # This handles strawberry.ID and other custom types that can be stringified
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
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId", default=None)
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
    created_by: Optional[str] = strawberry.field(name="createdBy", default=None)
    updated_by: Optional[str] = strawberry.field(name="updatedBy", default=None)
    
    # Internal storage for the borrower name from DB
    borrower_name_db: strawberry.Private[Optional[str]] = "N/A"

    @strawberry.field(name="loanProduct")
    async def loan_product(self, info: Info) -> Optional[LoanProduct]:
        target_product_id = self.loan_product_id
        
        # If transaction doesn't have loanProductId, fetch from the loan
        if not target_product_id:
            try:
                loans_collection = get_loans_collection()
                loan_crud = LoanCRUD(loans_collection)
                loan_db = await loan_crud.get_loan_by_id(str(self.loan_id))
                if loan_db:
                    target_product_id = loan_db.loan_product_id
            except Exception as e:
                print(f"Error fetching loan for product fallback: {e}")

        if not target_product_id:
            return None
        
        from bson import ObjectId
        if ObjectId.is_valid(target_product_id):
            try:
                product_data = await loan_product_crud.get_loan_product_by_id(target_product_id)
                if product_data:
                    return convert_lp_db_to_type(product_data)
            except Exception as e:
                print(f"Error resolving loan product by ID {target_product_id}: {e}")
        
        # Fallback: if not an ID or not found by ID, it might be a legacy string name
        return LoanProduct(
            id="legacy",
            product_code="LEGACY",
            product_name=str(target_product_id),
            term_type="N/A",
            gl_code="N/A",
            type="LEGACY",
            default_interest_rate=Decimal("0.0"),
            template="N/A",
            security="N/A",
            br_lc="N/A",
            mode_of_payment="N/A",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    @strawberry.field(name="borrowerName")
    async def borrower_name_resolver(self, info: Info) -> Optional[str]:
        # Use stored name if available and not "N/A"
        if self.borrower_name_db and self.borrower_name_db != "N/A":
            return self.borrower_name_db
            
        # Fallback: fetch from the loan
        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            loan_db = await loan_crud.get_loan_by_id(str(self.loan_id))
            if loan_db:
                # We have the loan, now get the borrower name from it
                # The loan itself has a borrower_name resolver or customer.displayName
                from .database import get_customers_collection
                from .database.customer_crud import CustomerCRUD
                customers_collection = get_customers_collection()
                customer_crud = CustomerCRUD(customers_collection)
                customer_data = await customer_crud.get_customer_by_id(str(loan_db.borrower_id))
                if customer_data:
                    return customer_data.display_name
        except Exception as e:
            print(f"Error resolving borrower name fallback for transaction {self.id}: {e}")
            
        return "N/A"

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
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId", default=None)
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
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId", default=None)
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
    # Ensure datetime fields are actual datetime objects (Pydantic should do this, but being safe)
    def ensure_datetime(dt):
        if isinstance(dt, str):
            try:
                return datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return datetime.utcnow()
        return dt

    transaction_type = LoanTransactionType(

        id=strawberry.ID(str(db_obj.id)),
        loan_id=strawberry.ID(str(db_obj.loan_id)),
        transaction_type=db_obj.transaction_type,
        amount=db_obj.amount,
        transaction_date=ensure_datetime(db_obj.transaction_date),
        notes=db_obj.notes,
        created_at=ensure_datetime(db_obj.created_at),
        updated_at=ensure_datetime(db_obj.updated_at),
        commercial_bank=db_obj.commercial_bank,
        servicing_branch=db_obj.servicing_branch,
        region=db_obj.region,
        loan_product_id=db_obj.loan_product_id,
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
        created_by=db_obj.created_by,
        updated_by=db_obj.updated_by,
        borrower_name_db=db_obj.borrower_name or "N/A"
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
        
        # if redis:
        #     cached = redis.get(cache_key)
        #     if cached:
        #         print(f"--- Cache hit for {cache_key} ---")
        #         data = json.loads(cached)
        #         
        #         # Convert back types using camelCase keys from asdict
        #         if data.get('amount'): data['amount'] = Decimal(str(data['amount']))
        #         if data.get('transactionDate'): data['transactionDate'] = datetime.fromisoformat(data['transactionDate'])
        #         if data.get('createdAt'): data['createdAt'] = datetime.fromisoformat(data['createdAt'])
        #         if data.get('updatedAt'): data['updatedAt'] = datetime.fromisoformat(data['updatedAt'])
        #         
        #         # Filter for constructor
        #         final_data = {}
        #         for k, v in data.items():
        #             if k == 'loanId': final_data['loan_id'] = strawberry.ID(v)
        #             elif k == 'transactionType': final_data['transaction_type'] = v
        #             elif k == 'transactionDate': final_data['transaction_date'] = v
        #             elif k == 'createdAt': final_data['created_at'] = v
        #             elif k == 'updatedAt': final_data['updated_at'] = v
        #             elif k == 'commercialBank': final_data['commercial_bank'] = v
        #             elif k == 'servicingBranch': final_data['servicing_branch'] = v
        #             elif k == 'referenceNumber': final_data['reference_number'] = v
        #             elif k == 'debitAccount': final_data['debit_account'] = v
        #             elif k == 'creditAccount': final_data['credit_account'] = v
        #             elif k == 'disbursementMethod': final_data['disbursement_method'] = v
        #             elif k == 'disbursementStatus': final_data['disbursement_status'] = v
        #             elif k == 'chequeNumber': final_data['cheque_number'] = v
        #             elif k == 'beneficiaryBank': final_data['beneficiary_bank'] = v
        #             elif k == 'beneficiaryAccount': final_data['beneficiary_account'] = v
        #             elif k == 'approvedBy': final_data['approved_by'] = v
        #             elif k == 'processedBy': final_data['processed_by'] = v
        #             elif k == 'borrowerName': final_data['borrower_name'] = v
        #             elif k == 'loanProduct': final_data['loan_product'] = v
        #             else: final_data[k] = v
        #
        #         obj = LoanTransactionType(**final_data)
        #         return LoanTransactionResponse(success=True, message="Loan transaction retrieved from cache", transaction=obj)

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            transaction_db = await transaction_crud.get_loan_transaction_by_id(str(transaction_id))

            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            if redis:
                redis.setex(cache_key, 3600, json.dumps(strawberry.asdict(transaction_type), default=json_serial))

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
        search_term: Optional[str] = None,
        transaction_type: Optional[str] = None
    ) -> LoanTransactionsResponse:
        """Get a list of loan transactions with optional filtering by loan_id, search_term or transaction_type"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        redis = info.context.get("request").app.state.redis
        cache_key = f"loan_transactions:list:{skip}:{limit}:{loan_id}:{search_term}:{transaction_type}"
        
        # if redis:
        #     cached = redis.get(cache_key)
        #     if cached:
        #         print(f"--- Cache hit for {cache_key} ---")
        #         cache_data = json.loads(cached)
        #         transactions = []
        #         
        #         for t in cache_data['transactions']:
        #             if t.get('amount'): t['amount'] = Decimal(str(t['amount']))
        #             if t.get('transactionDate'): t['transactionDate'] = datetime.fromisoformat(t['transactionDate'])
        #             if t.get('createdAt'): t['createdAt'] = datetime.fromisoformat(t['createdAt'])
        #             if t.get('updatedAt'): t['updatedAt'] = datetime.fromisoformat(t['updatedAt'])
        #             
        #             final_t = {}
        #             for k, v in t.items():
        #                 if k == 'loanId': final_t['loan_id'] = strawberry.ID(v)
        #                 elif k == 'transactionType': final_t['transaction_type'] = v
        #                 elif k == 'transactionDate': final_t['transaction_date'] = v
        #                 elif k == 'createdAt': final_t['created_at'] = v
        #                 elif k == 'updatedAt': final_t['updated_at'] = v
        #                 elif k == 'commercialBank': final_t['commercial_bank'] = v
        #                 elif k == 'servicingBranch': final_t['servicing_branch'] = v
        #                 elif k == 'referenceNumber': final_t['reference_number'] = v
        #                 elif k == 'debitAccount': final_t['debit_account'] = v
        #                 elif k == 'creditAccount': final_t['credit_account'] = v
        #                 elif k == 'disbursementMethod': final_t['disbursement_method'] = v
        #                 elif k == 'disbursementStatus': final_t['disbursement_status'] = v
        #                 elif k == 'chequeNumber': final_t['cheque_number'] = v
        #                 elif k == 'beneficiaryBank': final_t['beneficiary_bank'] = v
        #                 elif k == 'beneficiaryAccount': final_t['beneficiary_account'] = v
        #                 elif k == 'approvedBy': final_t['approved_by'] = v
        #                 elif k == 'processedBy': final_t['processed_by'] = v
        #                 elif k == 'borrowerName': final_t['borrower_name'] = v
        #                 elif k == 'loanProduct': final_t['loan_product'] = v
        #                 else: final_t[k] = v
        #                     
        #             obj = LoanTransactionType(**final_t)
        #             transactions.append(obj)
        #         return LoanTransactionsResponse(success=True, message="Loan transactions retrieved from cache", transactions=transactions, total=cache_data['total'])

        try:
            loan_transactions_collection = get_loan_transactions_collection()
            transaction_crud = LoanTransactionCRUD(loan_transactions_collection)
            
            transactions_db = await transaction_crud.get_loan_transactions(
                skip=skip, 
                limit=limit, 
                loan_id=str(loan_id) if loan_id else None, 
                search_term=search_term,
                transaction_type=transaction_type
            )
            total = await transaction_crud.count_loan_transactions(
                loan_id=str(loan_id) if loan_id else None, 
                search_term=search_term,
                transaction_type=transaction_type
            )

            transactions_type = [convert_db_to_transaction_type(t) for t in transactions_db]
            
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
    @staticmethod
    async def _clear_loan_transaction_cache(redis, transaction_id=None):
        if not redis: return
        if transaction_id:
            redis.delete(f"loan_transaction:{transaction_id}")
        keys = redis.keys("loan_transactions:list:*")
        for key in keys:
            redis.delete(key)
            
        # Clear recent transactions cache
        rt_keys = redis.keys("recent_transactions:*")
        for key in rt_keys:
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

            user_id = str(current_user.id)

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
                loan_product_id=input.loan_product_id,
                reference_number=input.reference_number,
                debit_account=input.debit_account,
                credit_account=input.credit_account,
                disbursement_method=input.disbursement_method,
                disbursement_status=input.disbursement_status,
                cheque_number=input.cheque_number,
                beneficiary_bank=input.beneficiary_bank,
                beneficiary_account=input.beneficiary_account,
                approved_by=input.approved_by,
                processed_by=input.processed_by,
                created_by=user_id,
                updated_by=user_id
            )
            
            transaction_db = await transaction_crud.create_loan_transaction(loan_transaction_base)
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            redis = info.context.get("request").app.state.redis
            await LoanTransactionMutation._clear_loan_transaction_cache(redis)

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

            user_id = str(current_user.id)

            print(f"DEBUG: update_loan_transaction input: {input}")
            update_data = {k: (float(v) if isinstance(v, Decimal) else v) 
                           for k, v in strawberry.asdict(input).items() if v is not None}
            
            update_data["updated_by"] = user_id
            
            print(f"DEBUG: update_loan_transaction update_data: {update_data}")
            
            transaction_db = await transaction_crud.update_loan_transaction(str(transaction_id), update_data)
            if not transaction_db:
                return LoanTransactionResponse(success=False, message="Loan transaction not found")
            
            transaction_type = convert_db_to_transaction_type(transaction_db)
            
            redis = info.context.get("request").app.state.redis
            await LoanTransactionMutation._clear_loan_transaction_cache(redis, transaction_id)

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
            await LoanTransactionMutation._clear_loan_transaction_cache(redis, transaction_id)

            return LoanTransactionResponse(success=True, message="Loan transaction deleted successfully")
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanTransactionResponse(success=False, message=f"Error deleting loan transaction: {str(e)}")
