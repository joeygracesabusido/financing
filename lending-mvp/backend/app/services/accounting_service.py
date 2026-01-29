from datetime import datetime
from ..database import client, ledger_collection
from decimal import Decimal
import uuid
from typing import List

async def post_transaction(debit_account: str, credit_account: str, amount: Decimal, tx_id: str = None):
    """
    Posts a balanced debit/credit transaction atomically.
    """
    if amount <= 0:
        raise ValueError("Transaction amount must be positive.")

    transaction_id = tx_id or str(uuid.uuid4())

    debit_entry = {
        "transaction_id": transaction_id,
        "account": debit_account,
        "amount": amount,
        "entry_type": "debit",
        "timestamp": datetime.utcnow()
    }
    credit_entry = {
        "transaction_id": transaction_id,
        "account": credit_account,
        "amount": amount,
        "entry_type": "credit",
        "timestamp": datetime.utcnow()
    }

    async with await client.start_session() as session:
        try:
            async def commit_transaction(s):
                await ledger_collection.insert_many(
                    [debit_entry, credit_entry],
                    session=s
                )
            await session.with_transaction(commit_transaction)
            print(f"Transaction {transaction_id} posted successfully.")
            return True
        except Exception as e:
            print(f"Transaction failed: {e}")
            # The transaction will be automatically aborted if an exception occurs
            return False

async def get_ledger_for_borrower(borrower_id: str) -> List[dict]:
    """
    Placeholder to get ledger entries.
    A real implementation would link entries to a borrower.
    """
    # For MVP, just return all entries, newest first.
    return await ledger_collection.find().sort("timestamp", -1).to_list(100)