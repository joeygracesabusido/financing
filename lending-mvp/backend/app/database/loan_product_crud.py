from typing import List, Optional
from bson import ObjectId
from pymongo.results import InsertOneResult, UpdateResult, DeleteResult
from datetime import datetime

from ..basemodel.loan_product_model import LoanProduct, LoanProductCreate, LoanProductUpdate
from . import get_db

async def get_loan_products_collection():
    db_client = get_db()
    return db_client.loan_products

async def create_loan_product(loan_product_data: LoanProductCreate) -> LoanProduct:
    collection = await get_loan_products_collection()
    loan_product_dict = loan_product_data.model_dump()
    loan_product_dict["created_at"] = loan_product_dict["updated_at"] = datetime.utcnow()
    result: InsertOneResult = await collection.insert_one(loan_product_dict)
    
    # Retrieve the inserted document to ensure it matches the LoanProduct model including default fields
    new_loan_product = await collection.find_one({"_id": result.inserted_id})
    return LoanProduct(**new_loan_product)

async def get_loan_product_by_id(loan_product_id: str) -> Optional[LoanProduct]:
    collection = await get_loan_products_collection()
    if not ObjectId.is_valid(loan_product_id):
        return None
    loan_product = await collection.find_one({"_id": ObjectId(loan_product_id)})
    if loan_product:
        return LoanProduct(**loan_product)
    return None

async def get_loan_product_by_code(product_code: str) -> Optional[LoanProduct]:
    collection = await get_loan_products_collection()
    loan_product = await collection.find_one({"product_code": product_code})
    if loan_product:
        return LoanProduct(**loan_product)
    return None

async def get_all_loan_products() -> List[LoanProduct]:
    collection = await get_loan_products_collection()
    loan_products = []
    async for loan_product in collection.find():
        loan_products.append(LoanProduct(**loan_product))
    return loan_products

async def update_loan_product(loan_product_id: str, loan_product_data: LoanProductUpdate) -> Optional[LoanProduct]:
    collection = await get_loan_products_collection()
    if not ObjectId.is_valid(loan_product_id):
        return None
    
    update_data = {k: v for k, v in loan_product_data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        return await get_loan_product_by_id(loan_product_id) # No update data provided

    update_data["updated_at"] = datetime.utcnow()

    result: UpdateResult = await collection.update_one(
        {"_id": ObjectId(loan_product_id)},
        {"$set": update_data}
    )
    if result.modified_count == 1:
        return await get_loan_product_by_id(loan_product_id)
    return None

async def delete_loan_product(loan_product_id: str) -> bool:
    collection = await get_loan_products_collection()
    if not ObjectId.is_valid(loan_product_id):
        return False
    result: DeleteResult = await collection.delete_one({"_id": ObjectId(loan_product_id)})
    return result.deleted_count == 1

