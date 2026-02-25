import strawberry
from typing import List, Optional
from datetime import datetime
from strawberry.types import Info
from .database import get_db, get_loan_transactions_collection
from .database.loan_transaction_crud import LoanTransactionCRUD
from .database.transaction_crud import TransactionCRUD
from .database.savings_crud import SavingsCRUD
from .models import UserInDB
import json
from decimal import Decimal

def json_serial(obj):
    if isinstance(obj, (datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj)

@strawberry.type
class UnifiedTransaction:
    id: strawberry.ID
    date: datetime
    amount: float
    name: str
    user: str
    method: str
    category: str

@strawberry.type
class RecentTransactionsQuery:
    @strawberry.field
    async def recent_transactions(self, info: Info, limit: int = 10) -> List[UnifiedTransaction]:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return []

        redis = info.context.get("request").app.state.redis
        cache_key = f"recent_transactions:{current_user.id}:{limit}"
        
        if redis:
            cached = redis.get(cache_key)
            if cached:
                print(f"--- Cache hit for {cache_key} ---")
                data = json.loads(cached)
                return [UnifiedTransaction(
                    id=t['id'],
                    date=datetime.fromisoformat(t['date']),
                    amount=t['amount'],
                    name=t['name'],
                    user=t.get('user', 'N/A'),
                    method=t['method'],
                    category=t['category']
                ) for t in data]

        db = get_db()
        from .database.customer_crud import CustomerCRUD
        customer_crud = CustomerCRUD(db.customers)

        # 1. Fetch Savings Transactions
        savings_crud = SavingsCRUD(db.savings)
        
        # Fetching directly from collection for speed
        savings_txs_cursor = db.transactions.find().sort("timestamp", -1).limit(limit)
        savings_txs = await savings_txs_cursor.to_list(length=limit)
        
        unified = []
        for tx in savings_txs:
            # For savings, we need to find the user name via the account
            user_display_name = "N/A"
            account = await savings_crud.get_savings_account_by_id(str(tx["account_id"]))
            if account:
                customer = await customer_crud.get_customer_by_id(str(account.user_id))
                if customer:
                    user_display_name = customer.display_name

            unified.append(UnifiedTransaction(
                id=str(tx["_id"]),
                date=tx["timestamp"],
                amount=float(tx["amount"]) * (-1 if tx["transaction_type"] == "withdrawal" else 1),
                name=tx.get("notes") or tx["transaction_type"].capitalize(),
                user=user_display_name,
                method="Savings",
                category=tx["transaction_type"].capitalize()
            ))

        # 2. Fetch Loan Transactions
        loan_tx_col = get_loan_transactions_collection()
        loan_tx_crud = LoanTransactionCRUD(loan_tx_col)
        loan_txs = await loan_tx_crud.get_loan_transactions(limit=limit)
        
        for tx in loan_txs:
            unified.append(UnifiedTransaction(
                id=str(tx.id),
                date=tx.transaction_date,
                amount=float(tx.amount) * (-1 if tx.transaction_type in ["disbursement", "fee", "penalty"] else 1),
                name=tx.notes or tx.transaction_type.capitalize(),
                user=tx.borrower_name or "N/A",
                method="Loan",
                category=tx.transaction_type.capitalize()
            ))

        # Sort combined and take top 'limit'
        unified.sort(key=lambda x: x.date, reverse=True)
        result = unified[:limit]

        if redis:
            redis.setex(cache_key, 300, json.dumps([strawberry.asdict(t) for t in result], default=json_serial))

        return result
