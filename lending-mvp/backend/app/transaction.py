import strawberry
from typing import List, Optional
from strawberry.types import Info
from .database import get_db
from .database.savings_crud import SavingsCRUD
from .database.transaction_crud import TransactionCRUD
from .basemodel.transaction_model import TransactionBase, TransactionInDB # Added TransactionInDB
from .models import UserInDB
from .savings import TransactionType, TransactionsResponse, TransactionCreateInput, TransactionResponse

from decimal import Decimal
from datetime import datetime
import json

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

def map_db_transaction_to_strawberry_type(trans_data: TransactionInDB) -> TransactionType:
    """Maps a TransactionInDB object from the DB to a TransactionType."""
    return TransactionType(
        id=strawberry.ID(str(trans_data.id)),
        account_id=strawberry.ID(str(trans_data.account_id)),
        transaction_type=trans_data.transaction_type,
        amount=trans_data.amount,
        timestamp=trans_data.timestamp,
        notes=trans_data.notes
    )

@strawberry.type
class TransactionQuery:
    @strawberry.field
    async def getTransactions(self, info: Info, account_id: strawberry.ID) -> TransactionsResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return TransactionsResponse(success=False, message="Not authenticated", transactions=[], total=0)

        redis = info.context.get("request").app.state.redis
        cache_key = f"transactions:list:{account_id}"
        
        if redis:
            cached = redis.get(cache_key)
            if cached:
                print(f"--- Cache hit for {cache_key} ---")
                data = json.loads(cached)
                transactions = []
                for t in data['transactions']:
                    t['timestamp'] = datetime.fromisoformat(t['timestamp'])
                    transactions.append(TransactionType(**t))
                return TransactionsResponse(success=True, message="Transactions retrieved from cache", transactions=transactions, total=data['total'])

        db = get_db()
        # Authorization: Ensure the user owns the account they are querying transactions for
        savings_crud = SavingsCRUD(db.savings)
        account = await savings_crud.get_savings_account_by_id(str(account_id))
        # if not account or str(account.user_id) != str(current_user.id): # Corrected to account.user_id
        #     return TransactionsResponse(success=False, message="Not authorized", transactions=[])
            
        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        transactions_data = await transaction_crud.get_transactions_by_account_id(str(account_id))

        transactions = [map_db_transaction_to_strawberry_type(t) for t in transactions_data]
        
        if redis:
            cache_data = {
                'total': len(transactions),
                'transactions': [strawberry.asdict(t) for t in transactions]
            }
            redis.setex(cache_key, 3600, json.dumps(cache_data, default=json_serial))

        return TransactionsResponse(success=True, message="Transactions retrieved", transactions=transactions, total=len(transactions))

@strawberry.type
class TransactionMutation:
    @staticmethod
    async def _clear_transaction_cache(redis, account_id):
        if not redis: return
        # Clear transaction list for this account
        redis.delete(f"transactions:list:{account_id}")
        # Clear savings account detail and lists as balance changed
        redis.delete(f"savings_account:{account_id}")
        keys = redis.keys("savings_accounts:list:*")
        for key in keys:
            redis.delete(key)
        
        # Clear recent transactions cache
        rt_keys = redis.keys("recent_transactions:*")
        for key in rt_keys:
            redis.delete(key)
            
        print(f"--- Cache cleared for transactions and savings account {account_id} ---")

    async def _create_transaction(self, info: Info, input: TransactionCreateInput, trans_type: str) -> TransactionResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            return TransactionResponse(success=False, message="Not authenticated")

        db = get_db()
        savings_crud = SavingsCRUD(db.savings)
        
        # Authorization check
        # account = await savings_crud.get_savings_account_by_id(str(input.account_id))
        # if not account or str(account.user_id) != str(current_user.id): # Corrected to account.user_id
        #     return TransactionResponse(success=False, message="Not authorized for this account")

        transaction_crud = TransactionCRUD(db.transactions, savings_crud)
        
        transaction_to_create = TransactionBase(
            account_id=input.account_id,
            transaction_type=trans_type,
            amount=input.amount,
            notes=input.notes
        )

        created_transaction = await transaction_crud.create_transaction(transaction_to_create)

        if not created_transaction:
            return TransactionResponse(success=False, message=f"Failed to create {trans_type}. Insufficient funds or error.")

        transaction = map_db_transaction_to_strawberry_type(created_transaction)
        
        redis = info.context.get("request").app.state.redis
        await TransactionMutation._clear_transaction_cache(redis, input.account_id)

        return TransactionResponse(success=True, message=f"{trans_type.capitalize()} successful", transaction=transaction)

    @strawberry.field
    async def createDeposit(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await self._create_transaction(info, input, "deposit")

    @strawberry.field
    async def createWithdrawal(self, info: Info, input: TransactionCreateInput) -> TransactionResponse:
        return await self._create_transaction(info, input, "withdrawal")
