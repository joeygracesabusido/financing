from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from decimal import Decimal


class StandingOrderCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create_standing_order(self, order_data: dict) -> str:
        result = await self.collection.insert_one(order_data)
        return str(result.inserted_id)

    async def get_standing_order_by_id(self, order_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(order_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(order_id)})

    async def get_standing_orders_by_account(self, account_id: str) -> List[dict]:
        return await self.collection.find({
            "$or": [
                {"source_account_id": account_id},
                {"destination_account_id": account_id}
            ]
        }).to_list(length=100)

    async def get_active_standing_orders(self) -> List[dict]:
        return await self.collection.find({"is_active": True}).to_list(length=1000)

    async def update_standing_order(self, order_id: str, update_data: dict) -> bool:
        if not ObjectId.is_valid(order_id):
            return False
        result = await self.collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete_standing_order(self, order_id: str) -> bool:
        if not ObjectId.is_valid(order_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(order_id)})
        return result.deleted_count > 0

    async def execute_standing_order(self, order_id: str) -> bool:
        order = await self.get_standing_order_by_id(order_id)
        if not order or not order.get("is_active"):
            return False
        
        from .savings_crud import SavingsCRUD
        from ..database import get_db
        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        
        source_account = await savings_crud.get_savings_account_by_id(order["source_account_id"])
        if not source_account or source_account.balance < order["amount"]:
            return False
        
        await savings_crud.update_balance(order["source_account_id"], -Decimal(str(order["amount"])))
        await savings_crud.update_balance(order["destination_account_id"], Decimal(str(order["amount"])))
        
        await self.collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"last_executed_date": datetime.utcnow()}}
        )
        return True


class InterestComputationCRUD:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def compute_daily_interest(self, account_id: str, balance: Decimal, rate: Decimal) -> Decimal:
        daily_rate = rate / Decimal("365")
        interest = balance * daily_rate
        return interest.quantize(Decimal("0.01"))

    async def compute_average_daily_balance(self, account_id: str, start_date: datetime, end_date: datetime) -> Decimal:
        from .transaction_crud import TransactionCRUD
        from .savings_crud import SavingsCRUD
        from ..database import get_db
        
        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        
        transactions = await transaction_crud.get_transactions_by_account_id(account_id)
        
        daily_balances = []
        current_date = start_date
        running_balance = Decimal("0.00")
        
        for trans in transactions:
            trans_date = trans.timestamp.date() if hasattr(trans.timestamp, 'date') else trans.timestamp
            while current_date.date() < trans_date:
                daily_balances.append(running_balance)
                current_date += timedelta(days=1)
            
            if trans.transaction_type == "deposit":
                running_balance += Decimal(str(trans.amount))
            elif trans.transaction_type == "withdrawal":
                running_balance -= Decimal(str(trans.amount))
        
        while current_date <= end_date:
            daily_balances.append(running_balance)
            current_date += timedelta(days=1)
        
        if not daily_balances:
            return Decimal("0.00")
        
        total = sum(daily_balances, Decimal("0.00"))
        return (total / Decimal(str(len(daily_balances)))).quantize(Decimal("0.01"))

    async def post_interest(self, account_id: str, interest_amount: Decimal, withholding_tax: Decimal = Decimal("0.00")) -> bool:
        from .savings_crud import SavingsCRUD
        from ..database import get_db
        
        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        
        net_interest = interest_amount - (interest_amount * withholding_tax)
        
        await savings_crud.update_balance(account_id, net_interest)
        
        interest_entry = {
            "account_id": account_id,
            "gross_interest": str(interest_amount),
            "withholding_tax": str(interest_amount * withholding_tax),
            "net_interest": str(net_interest),
            "posted_date": datetime.utcnow()
        }
        
        await self.collection.insert_one(interest_entry)
        return True


from datetime import timedelta
