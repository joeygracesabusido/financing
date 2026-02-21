from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timezone
from ..basemodel.loan_transaction_model import LoanTransaction, LoanTransactionBase
from ..models import PyObjectId

class LoanTransactionCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_loan_transaction(self, transaction: LoanTransactionBase) -> LoanTransaction:
        loan_transaction_in_db = LoanTransaction(
            **transaction.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        doc = loan_transaction_in_db.model_dump(
            by_alias=True,
            exclude={"id"},
            exclude_unset=True,
        )

        result = await self.collection.insert_one(doc)
        loan_transaction_in_db.id = result.inserted_id
        return loan_transaction_in_db

    async def get_loan_transaction_by_id(self, transaction_id: str) -> Optional[LoanTransaction]:
        if not ObjectId.is_valid(transaction_id):
            return None
        transaction_data = await self.collection.find_one({"_id": ObjectId(transaction_id)})
        if transaction_data:
            return LoanTransaction.model_validate(transaction_data)
        return None
    
    async def get_loan_transactions_by_loan_id(self, loan_id: str, skip: int = 0, limit: int = 100) -> List[LoanTransaction]:
        transactions_data = await self.collection.find({"loan_id": loan_id}).skip(skip).limit(limit).to_list(length=limit)
        return [LoanTransaction.model_validate(transaction_data) for transaction_data in transactions_data]

    async def get_loan_transactions(self, skip: int = 0, limit: int = 100, loan_id: Optional[str] = None, search_term: Optional[str] = None, transaction_type: Optional[str] = None) -> List[LoanTransaction]:
        query: Dict[str, Any] = {}
        if loan_id:
            # Try matching loan_id as string, ObjectId (if valid), or integer (if numeric)
            id_matches = [loan_id]
            if ObjectId.is_valid(loan_id):
                id_matches.append(ObjectId(loan_id))
            if loan_id.isdigit():
                id_matches.append(int(loan_id))
            
            query["loan_id"] = {"$in": id_matches}
        
        if transaction_type:
            query["transaction_type"] = transaction_type

        if search_term:
            query["$or"] = [
                {"borrower_name": {"$regex": search_term, "$options": "i"}},
                {"loan_product": {"$regex": search_term, "$options": "i"}},
                {"reference_number": {"$regex": search_term, "$options": "i"}},
                {"transaction_type": {"$regex": search_term, "$options": "i"}}
            ]
        
        transactions_data = await self.collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        return [LoanTransaction.model_validate(transaction_data) for transaction_data in transactions_data]

    async def count_loan_transactions(self, loan_id: Optional[str] = None, search_term: Optional[str] = None, transaction_type: Optional[str] = None) -> int:
        query: Dict[str, Any] = {}
        if loan_id:
            # Same robust matching for count
            id_matches = [loan_id]
            if ObjectId.is_valid(loan_id):
                id_matches.append(ObjectId(loan_id))
            if loan_id.isdigit():
                id_matches.append(int(loan_id))
            
            query["loan_id"] = {"$in": id_matches}

        if transaction_type:
            query["transaction_type"] = transaction_type
            
        if search_term:
            query["$or"] = [
                {"borrower_name": {"$regex": search_term, "$options": "i"}},
                {"loan_product": {"$regex": search_term, "$options": "i"}},
                {"reference_number": {"$regex": search_term, "$options": "i"}},
                {"transaction_type": {"$regex": search_term, "$options": "i"}}
            ]
        return await self.collection.count_documents(query)

    async def update_loan_transaction(self, transaction_id: str, update_data: Dict[str, Any]) -> Optional[LoanTransaction]:
        if not ObjectId.is_valid(transaction_id):
            return None

        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)

            result = await self.collection.update_one(
                {"_id": ObjectId(transaction_id)},
                {"$set": update_data}
            )
            if result.modified_count == 1:
                return await self.get_loan_transaction_by_id(transaction_id)
        return None

    async def delete_loan_transaction(self, transaction_id: str) -> bool:
        if not ObjectId.is_valid(transaction_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(transaction_id)})
        return result.deleted_count == 1