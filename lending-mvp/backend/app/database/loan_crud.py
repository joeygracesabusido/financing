from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timezone
from app.basemodel.loan_model import Loan, LoanCreate, LoanUpdate, PyObjectId

class LoanCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_loan(self, loan: LoanCreate) -> Loan:
        loan_in_db = Loan(
            **loan.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        doc = loan_in_db.model_dump(
            by_alias=True,
            exclude={"id"},
            exclude_unset=True,
        )

        result = await self.collection.insert_one(doc)
        loan_in_db.id = result.inserted_id
        return loan_in_db

    async def get_loan_by_id(self, loan_id: str) -> Optional[Loan]:
        if not ObjectId.is_valid(loan_id):
            return None
        loan_data = await self.collection.find_one({"_id": ObjectId(loan_id)})
        if loan_data:
            return Loan.model_validate(loan_data)
        return None

    async def get_loans(self, skip: int = 0, limit: int = 100, borrower_id: Optional[str] = None) -> List[Loan]:
        query: Dict[str, Any] = {}
        if borrower_id:
            if not ObjectId.is_valid(borrower_id):
                return []
            query["borrower_id"] = ObjectId(borrower_id)
        
        loans_data = await self.collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        return [Loan.model_validate(loan_data) for loan_data in loans_data]

    async def count_loans(self, borrower_id: Optional[str] = None) -> int:
        query: Dict[str, Any] = {}
        if borrower_id:
            if not ObjectId.is_valid(borrower_id):
                return 0
            query["borrower_id"] = ObjectId(borrower_id)
        return await self.collection.count_documents(query)

    async def update_loan(self, loan_id: str, loan_update: LoanUpdate) -> Optional[Loan]:
        if not ObjectId.is_valid(loan_id):
            return None

        update_data = loan_update.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            # Ensure borrower_id is converted to ObjectId if present
            if "borrower_id" in update_data and isinstance(update_data["borrower_id"], str):
                update_data["borrower_id"] = ObjectId(update_data["borrower_id"])

            result = await self.collection.update_one(
                {"_id": ObjectId(loan_id)},
                {"$set": update_data}
            )
            if result.modified_count == 1:
                return await self.get_loan_by_id(loan_id)
        return None

    async def delete_loan(self, loan_id: str) -> bool:
        if not ObjectId.is_valid(loan_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(loan_id)})
        return result.deleted_count == 1
