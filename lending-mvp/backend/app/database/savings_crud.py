from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..basemodel.deposit_model import AnySavingsAccount
from decimal import Decimal

class SavingsCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_savings_account(self, account: AnySavingsAccount) -> AnySavingsAccount:
        account_data = account.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(account_data)
        account.id = result.inserted_id
        return account

    async def get_savings_account_by_id(self, account_id: str) -> Optional[AnySavingsAccount]:
        if not ObjectId.is_valid(account_id):
            return None
        account_data = await self.collection.find_one({"_id": ObjectId(account_id)})
        if account_data:
            # Here we would need a way to deserialize into the correct savings account type
            # For simplicity, we'll just return the dict for now, but a real implementation
            # would use the 'type' field to determine which Pydantic model to use.
            return account_data
        return None

    async def get_savings_accounts_by_user_id(self, user_id: str) -> List[AnySavingsAccount]:
        if not ObjectId.is_valid(user_id):
            return []
        accounts_data = await self.collection.find({"user_id": ObjectId(user_id)}).to_list(length=100)
        # Similar to get_savings_account_by_id, a proper deserialization is needed here
        return accounts_data
    
    async def update_balance(self, account_id: str, amount: Decimal) -> bool:
        if not ObjectId.is_valid(account_id):
            return False
        
        result = await self.collection.update_one(
            {"_id": ObjectId(account_id)},
            {"$inc": {"balance": amount}}
        )
        return result.modified_count == 1
