from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..models import CustomerInDB, CustomerCreate, CustomerUpdate
from datetime import datetime, date, timezone

class CustomerCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    

    async def create_customer(self, customer: CustomerCreate) -> CustomerInDB:
        data = customer.model_dump(exclude_unset=True)

        # Convert date → datetime if present
        if data.get("birth_date") and isinstance(data["birth_date"], date):
            data["birth_date"] = datetime.combine(
                data["birth_date"],
                datetime.min.time(),
                tzinfo=timezone.utc
            )

        customer_in_db = CustomerInDB(
            **data,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        doc = customer_in_db.model_dump(
            by_alias=True,
            exclude={"id"},
            exclude_unset=True,
        )

        result = await self.collection.insert_one(doc)
        customer_in_db.id = result.inserted_id
        return customer_in_db
    async def get_customer_by_id(self, customer_id: str) -> Optional[CustomerInDB]:
        if not ObjectId.is_valid(customer_id):
            return None
        customer_data = await self.collection.find_one({"_id": ObjectId(customer_id)})
        if customer_data:
            return CustomerInDB.model_validate(customer_data)
        return None

    async def get_customer_by_email(self, email: str) -> Optional[CustomerInDB]:
        customer_data = await self.collection.find_one({"email_address": email})
        if customer_data:
            return CustomerInDB.model_validate(customer_data)
        return None

    async def get_customers(self, skip: int = 0, limit: int = 100, search_term: Optional[str] = None) -> List[CustomerInDB]:
        query: Dict[str, Any] = {}
        if search_term:
            # Case-insensitive regex search on display_name or email_address
            query = {
                "$or": [
                    {"display_name": {"$regex": search_term, "$options": "i"}},
                    {"email_address": {"$regex": search_term, "$options": "i"}}
                ]
            }
        
        customers_data = await self.collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        return [CustomerInDB.model_validate(customer_data) for customer_data in customers_data]

    async def count_customers(self, search_term: Optional[str] = None) -> int:
        query: Dict[str, Any] = {}
        if search_term:
            query = {
                "$or": [
                    {"display_name": {"$regex": search_term, "$options": "i"}},
                    {"email_address": {"$regex": search_term, "$options": "i"}}
                ]
            }
        return await self.collection.count_documents(query)

    async def update_customer(self, customer_id: str, customer_update: CustomerUpdate) -> Optional[CustomerInDB]:
        if not ObjectId.is_valid(customer_id):
            return None

        update_data = customer_update.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            result = await self.collection.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": update_data}
            )
            if result.modified_count == 1:
                return await self.get_customer_by_id(customer_id)
        return None

    async def delete_customer(self, customer_id: str) -> bool:
        if not ObjectId.is_valid(customer_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(customer_id)})
        return result.deleted_count == 1
