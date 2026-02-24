import strawberry
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import json
from app.basemodel.loan_product_model import (
    LoanProduct as PydanticLoanProduct,
    LoanProductCreate as PydanticLoanProductCreate,
    LoanProductUpdate as PydanticLoanProductUpdate,
    PyObjectId,
)
from app.database import loan_product_crud
from strawberry.types import Info

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    try:
        return str(obj)
    except:
        raise TypeError ("Type %s not serializable" % type(obj))

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
    mode_of_payment: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
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
    mode_of_payment: Optional[str] = None

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
    mode_of_payment: Optional[str] = None

def convert_lp_db_to_type(lp: PydanticLoanProduct) -> LoanProduct:
    data = lp.model_dump()
    data['id'] = str(lp.id)
    return LoanProduct(**data)

@strawberry.type
class LoanProductQuery:
    @strawberry.field
    async def loan_product(self, info: Info, id: str) -> Optional[LoanProduct]:
        redis = info.context.get("request").app.state.redis
        cache_key = f"loan_product:{id}"
        
        if redis:
            cached_data = redis.get(cache_key)
            if cached_data:
                print(f"--- Cache hit for {cache_key} ---")
                data = json.loads(cached_data)
                data['default_interest_rate'] = Decimal(data['default_interest_rate'])
                data['created_at'] = datetime.fromisoformat(data['created_at'])
                data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                return LoanProduct(**data)

        loan_product_data = await loan_product_crud.get_loan_product_by_id(id)
        if loan_product_data:
            result = convert_lp_db_to_type(loan_product_data)
            if redis:
                redis.setex(cache_key, 3600, json.dumps(strawberry.asdict(result), default=decimal_default))
            return result
        return None

    @strawberry.field
    async def loan_products(self, info: Info) -> List[LoanProduct]:
        redis = info.context.get("request").app.state.redis
        cache_key = "loan_products:all"
        
        if redis:
            cached_data = redis.get(cache_key)
            if cached_data:
                print(f"--- Cache hit for {cache_key} ---")
                data_list = json.loads(cached_data)
                results = []
                for data in data_list:
                    data['default_interest_rate'] = Decimal(data['default_interest_rate'])
                    data['created_at'] = datetime.fromisoformat(data['created_at'])
                    data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                    results.append(LoanProduct(**data))
                return results

        loan_products_data = await loan_product_crud.get_all_loan_products()
        results = [convert_lp_db_to_type(lp) for lp in loan_products_data]
        
        if redis:
            serializable_data = [strawberry.asdict(r) for r in results]
            redis.setex(cache_key, 3600, json.dumps(serializable_data, default=decimal_default))
            
        return results

@strawberry.type
class LoanProductMutation:
    @staticmethod
    async def _clear_loan_product_cache(redis, id=None):
        if not redis:
            return
        keys_to_delete = ["loan_products:all"]
        if id:
            keys_to_delete.append(f"loan_product:{id}")
        if keys_to_delete:
            redis.delete(*keys_to_delete)
        print(f"--- Cache cleared for {keys_to_delete} ---")

    @strawberry.mutation
    async def create_loan_product(self, info: Info, input: LoanProductCreateInput) -> LoanProduct:
        current_user = info.context.get("current_user")
        user_id = str(current_user.id) if current_user else "system"
        
        data = input.__dict__.copy()
        data["created_by"] = user_id
        data["updated_by"] = user_id
        
        loan_product_data = PydanticLoanProductCreate(**data)
        new_loan_product = await loan_product_crud.create_loan_product(loan_product_data)
        
        redis = info.context.get("request").app.state.redis
        await LoanProductMutation._clear_loan_product_cache(redis)
        
        return convert_lp_db_to_type(new_loan_product)

    @strawberry.mutation
    async def update_loan_product(self, info: Info, id: str, input: LoanProductUpdateInput) -> Optional[LoanProduct]:
        current_user = info.context.get("current_user")
        user_id = str(current_user.id) if current_user else "system"
        
        data = input.__dict__.copy()
        data["updated_by"] = user_id
        
        loan_product_data = PydanticLoanProductUpdate(**data)
        updated_loan_product = await loan_product_crud.update_loan_product(id, loan_product_data)
        
        if updated_loan_product:
            redis = info.context.get("request").app.state.redis
            await LoanProductMutation._clear_loan_product_cache(redis, id)
            return convert_lp_db_to_type(updated_loan_product)
        return None

    @strawberry.mutation
    async def delete_loan_product(self, info: Info, id: str) -> bool:
        success = await loan_product_crud.delete_loan_product(id)
        if success:
            redis = info.context.get("request").app.state.redis
            await LoanProductMutation._clear_loan_product_cache(redis, id)
        return success
