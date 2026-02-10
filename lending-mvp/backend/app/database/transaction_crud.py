from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..basemodel.transaction_model import TransactionBase, TransactionInDB
from .savings_crud import SavingsCRUD, _convert_decimal_to_str
from decimal import Decimal

class TransactionCRUD:
    def __init__(self, collection: AsyncIOMotorCollection, savings_crud: SavingsCRUD):
        self.collection = collection
        self.savings_crud = savings_crud

    async def create_transaction(self, transaction: TransactionBase) -> Optional[TransactionInDB]:
        # In a real-world scenario, you'd use a database transaction to ensure atomicity.
        # MongoDB supports multi-document transactions. For this example, we'll do a two-step process.

        # 1. Update the balance in the savings account
        amount_to_update = transaction.amount
        if transaction.transaction_type == "withdrawal":
            # Ensure the account has sufficient funds before updating
            account = await self.savings_crud.get_savings_account_by_id(str(transaction.account_id))
            if not account or account['balance'] < transaction.amount:
                return None # Insufficient funds
            amount_to_update = -transaction.amount

        balance_updated = await self.savings_crud.update_balance(str(transaction.account_id), amount_to_update)

        if not balance_updated:
            return None # Failed to update balance

        # 2. Create the transaction record
        transaction_in_db = TransactionInDB(**transaction.model_dump())
        
        doc = transaction_in_db.model_dump(by_alias=True, exclude={"id"})
        processed_doc = _convert_decimal_to_str(doc)
        result = await self.collection.insert_one(processed_doc)
        
        transaction_in_db.id = result.inserted_id
        return transaction_in_db

    async def get_transactions_by_account_id(self, account_id: str) -> List[TransactionInDB]:
        if not ObjectId.is_valid(account_id):
            return []
        transactions_data = await self.collection.find({"account_id": ObjectId(account_id)}).sort("timestamp", -1).to_list(length=100)
        return [TransactionInDB(**t) for t in transactions_data]
