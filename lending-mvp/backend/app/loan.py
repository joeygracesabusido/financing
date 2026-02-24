import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status
import json

from .basemodel.loan_model import Loan, LoanCreate, LoanUpdate, LoanOut, PyObjectId
from .models import UserInDB
from .database import get_loan_transactions_collection
from .database import get_loans_collection, get_db, get_customers_collection
from .database.loan_crud import LoanCRUD
from .database.customer_crud import CustomerCRUD
from .customer import CustomerType, convert_customer_db_to_customer_type
from .loan_product import LoanProduct, convert_lp_db_to_type
from .database import loan_product_crud

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return str(obj)
    try:
        return str(obj)
    except:
        raise TypeError ("Type %s not serializable" % type(obj))

# Loan Types (Strawberry)
@strawberry.type
class LoanType:
    id: strawberry.ID
    borrower_id: strawberry.ID
    loan_id: Optional[str] = strawberry.field(name="loanId")
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId")
    amount_requested: Decimal = strawberry.field(name="amountRequested")
    term_months: int = strawberry.field(name="termMonths")
    interest_rate: Decimal = strawberry.field(name="interestRate")
    mode_of_payment: Optional[str] = strawberry.field(name="modeOfPayment", default=None)
    status: str
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")

    @strawberry.field(name="loanProduct")
    async def loan_product(self, info: Info) -> Optional[LoanProduct]:
        if not self.loan_product_id:
            return None
        
        # Check if it's a valid ObjectId (new relational structure)
        from bson import ObjectId
        if ObjectId.is_valid(self.loan_product_id):
            try:
                product_data = await loan_product_crud.get_loan_product_by_id(self.loan_product_id)
                if product_data:
                    return convert_lp_db_to_type(product_data)
            except Exception as e:
                print(f"Error resolving loan product by ID for loan {self.id}: {e}")
        
        # Fallback: if not an ID or not found by ID, it might be a legacy string name
        # We return a dummy LoanProduct object with just the name
        return LoanProduct(
            id="legacy",
            product_code="LEGACY",
            product_name=self.loan_product_id,
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
    async def borrower_name(self, info: Info) -> Optional[str]:
        try:
            customers_collection = get_customers_collection()
            customer_crud = CustomerCRUD(customers_collection)
            customer_data = await customer_crud.get_customer_by_id(str(self.borrower_id))
            if customer_data:
                return customer_data.display_name
            return "N/A"
        except Exception as e:
            print(f"Error resolving borrower name for loan {self.id}: {e}")
            return "N/A"

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
    borrower_id: strawberry.ID = strawberry.field(name="borrowerId")
    loan_id: Optional[str] = strawberry.field(name="loanId", default=None)
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId", default=None)
    amount_requested: Decimal = strawberry.field(name="amountRequested")
    term_months: int = strawberry.field(name="termMonths")
    interest_rate: Decimal = strawberry.field(name="interestRate")
    mode_of_payment: Optional[str] = strawberry.field(name="modeOfPayment", default=None)
    status: Optional[str] = strawberry.field(default=None)

@strawberry.input
class LoanUpdateInput:
    borrower_id: Optional[strawberry.ID] = strawberry.field(name="borrowerId", default=None)
    loan_product_id: Optional[str] = strawberry.field(name="loanProductId", default=None)
    amount_requested: Optional[Decimal] = strawberry.field(name="amountRequested", default=None)
    term_months: Optional[int] = strawberry.field(name="termMonths", default=None)
    interest_rate: Optional[Decimal] = strawberry.field(name="interestRate", default=None)
    mode_of_payment: Optional[str] = strawberry.field(name="modeOfPayment", default=None)
    status: Optional[str] = strawberry.field(default=None)

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
        loan_id=loan_db.loan_id,
        loan_product_id=loan_db.loan_product_id,
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

        redis = info.context.get("request").app.state.redis
        cache_key = f"loan:{loan_id}"
        
        if redis:
            cached = redis.get(cache_key)
            if cached:
                print(f"--- Cache hit for {cache_key} ---")
                data = json.loads(cached)
                data['amount_requested'] = Decimal(data['amount_requested'])
                data['interest_rate'] = Decimal(data['interest_rate'])
                data['created_at'] = datetime.fromisoformat(data['created_at'])
                data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                return LoanResponse(success=True, message="Loan retrieved from cache", loan=LoanType(**data))

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
            
            # Skip caching for now due to async method serialization issues with strawberry.asdict
            # if redis:
            #     redis.setex(cache_key, 3600, json.dumps(strawberry.asdict(loan_type), default=json_serial))

            return LoanResponse(success=True, message="Loan retrieved successfully", loan=loan_type)
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error retrieving loan: {str(e)}")

    @strawberry.field
    async def loan_by_id_string(self, info: Info, loan_id: str) -> LoanResponse:
        """Get a single loan by its custom loan_id string (e.g. 'LOAN-123')"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            loan_db = await loan_crud.get_loan_by_id(loan_id)

            if not loan_db:
                return LoanResponse(success=False, message="Loan not found")
            
            loan_type = convert_loan_db_to_loan_type(loan_db)
            return LoanResponse(success=True, message="Loan retrieved successfully", loan=loan_type)
        except Exception as e:
            return LoanResponse(success=False, message=f"Error retrieving loan by string: {str(e)}")

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

        redis = info.context.get("request").app.state.redis
        cache_key = f"loans:list:{skip}:{limit}:{borrower_id}"
        
        if redis:
            cached = redis.get(cache_key)
            if cached:
                print(f"--- Cache hit for {cache_key} ---")
                data = json.loads(cached)
                loans = []
                for l in data['loans']:
                    l['amount_requested'] = Decimal(l['amount_requested'])
                    l['interest_rate'] = Decimal(l['interest_rate'])
                    l['created_at'] = datetime.fromisoformat(l['created_at'])
                    l['updated_at'] = datetime.fromisoformat(l['updated_at'])
                    loans.append(LoanType(**l))
                return LoansResponse(success=True, message="Loans retrieved from cache", loans=loans, total=data['total'])

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)
            
            # If a regular user, they can only see their own loans
            if current_user.role == "user":
                borrower_id = strawberry.ID(str(current_user.id))

            loans_db = await loan_crud.get_loans(skip=skip, limit=limit, borrower_id=str(borrower_id) if borrower_id else None)
            total = await loan_crud.count_loans(borrower_id=str(borrower_id) if borrower_id else None)

            loans_type = [convert_loan_db_to_loan_type(loan_db) for loan_db in loans_db]
            
            # Skip caching for now due to async method serialization issues with strawberry.asdict
            # if redis:
            #     cache_data = {
            #         'total': total,
            #         'loans': [strawberry.asdict(l) for l in loans_type]
            #     }
            #     redis.setex(cache_key, 3600, json.dumps(cache_data, default=json_serial))

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
    @staticmethod
    async def _clear_loan_cache(redis, loan_id=None):
        if not redis: return
        
        # Clear list caches
        keys_to_delete = redis.keys("loans:list:*")
        if not isinstance(keys_to_delete, list):
            keys_to_delete = []
            
        if loan_id:
            # Add the primary ID to delete
            keys_to_delete.append(f"loan:{loan_id}")
            
            # Also try to find the custom loanId to clear its cache too
            try:
                loans_collection = get_loans_collection()
                loan_crud = LoanCRUD(loans_collection)
                loan_db = await loan_crud.get_loan_by_id(str(loan_id))
                if loan_db:
                    if str(loan_db.id) != str(loan_id):
                        keys_to_delete.append(f"loan:{loan_db.id}")
                    if loan_db.loan_id and str(loan_db.loan_id) != str(loan_id):
                        keys_to_delete.append(f"loan:{loan_db.loan_id}")
            except Exception as e:
                print(f"Error during cache clearing: {e}")

        if keys_to_delete:
            # Filter unique keys and ensure they are strings for delete
            unique_keys = list(set([k.decode() if isinstance(k, bytes) else k for k in keys_to_delete]))
            redis.delete(*unique_keys)
            print(f"--- Cache cleared for loans: {unique_keys} ---")

    @strawberry.mutation
    async def create_loan(self, info: Info, input: LoanCreateInput) -> LoanResponse:
        """Create a new loan application"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
        print(f"--- Mutation: create_loan ---")
        print(f"Input: {input}")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)

            # Convert Strawberry input to dict and handle types
            loan_data = {k: v for k, v in strawberry.asdict(input).items() if v is not None}
            print(f"Mapped Loan Data: {loan_data}")
            
            # Map types explicitly for the Pydantic model
            loan_create = LoanCreate(
                borrower_id=PyObjectId(str(loan_data["borrower_id"])),
                loan_id=loan_data.get("loan_id"),
                loan_product_id=loan_data.get("loan_product_id"),
                amount_requested=loan_data["amount_requested"],
                term_months=loan_data["term_months"],
                interest_rate=loan_data["interest_rate"],
                mode_of_payment=loan_data.get("mode_of_payment"),
                status=loan_data.get("status")
            )
            print(f"LoanCreate Pydantic: {loan_create}")
            
            loan_db = await loan_crud.create_loan(loan_create)
            print(f"Loan Created in DB: {loan_db.id}")
            
            loan_type = convert_loan_db_to_loan_type(loan_db)
            
            redis = info.context.get("request").app.state.redis
            await LoanMutation._clear_loan_cache(redis)

            return LoanResponse(success=True, message="Loan application created successfully", loan=loan_type)
        except Exception as e:
            print(f"Error in create_loan mutation: {e}")
            import traceback
            traceback.print_exc()
            return LoanResponse(success=False, message=f"Error creating loan: {str(e)}")

    @strawberry.mutation
    async def update_loan(self, info: Info, loan_id: strawberry.ID, input: LoanUpdateInput) -> LoanResponse:
        """Update an existing loan's details"""
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        print(f"--- Mutation: update_loan ---")
        print(f"Loan ID: {loan_id}, Input: {input}")

        try:
            loans_collection = get_loans_collection()
            loan_crud = LoanCRUD(loans_collection)

            # Convert Strawberry input to dict and remove None values (exclude_unset equivalent)
            loan_update_data = {k: v for k, v in strawberry.asdict(input).items() if v is not None}
            print(f"Mapped Update Data: {loan_update_data}")
            
            if "borrower_id" in loan_update_data and loan_update_data["borrower_id"] is not None:
                loan_update_data["borrower_id"] = PyObjectId(str(loan_update_data["borrower_id"]))

            loan_update = LoanUpdate(**loan_update_data)
            print(f"LoanUpdate Pydantic: {loan_update}")
            
            loan_db = await loan_crud.update_loan(str(loan_id), loan_update)
            if not loan_db:
                print(f"Loan not found for ID: {loan_id}")
                return LoanResponse(success=False, message="Loan not found")
            
            print(f"Loan Updated in DB: {loan_db.id}")
            loan_type = convert_loan_db_to_loan_type(loan_db)
            
            redis = info.context.get("request").app.state.redis
            await LoanMutation._clear_loan_cache(redis, loan_id)

            return LoanResponse(success=True, message="Loan updated successfully", loan=loan_type)
        except Exception as e:
            print(f"Error in update_loan mutation: {e}")
            import traceback
            traceback.print_exc()
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
            
            redis = info.context.get("request").app.state.redis
            await LoanMutation._clear_loan_cache(redis, loan_id)

            return LoanResponse(success=True, message="Loan deleted successfully")
        except HTTPException as e:
            raise e
        except Exception as e:
            return LoanResponse(success=False, message=f"Error deleting loan: {str(e)}")
