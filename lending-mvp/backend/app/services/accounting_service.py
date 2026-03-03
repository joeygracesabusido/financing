from datetime import datetime
from decimal import Decimal
import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import LedgerEntry, JournalEntry, JournalLine, GLAccount

async def post_transaction(
    db: AsyncSession, 
    debit_account: str, 
    credit_account: str, 
    amount: Decimal, 
    tx_id: str = None,
    branch_id: int = 1,
    branch_code: str = "HQ",
    description: str = None
):
    """
    Posts a balanced debit/credit transaction atomically using PostgreSQL.
    """
    if amount <= 0:
        raise ValueError("Transaction amount must be positive.")

    transaction_id = tx_id or str(uuid.uuid4())
    
    if not description:
        description = f"Transaction {transaction_id}"

    try:
        # Create journal entry
        journal_entry = JournalEntry(
            reference_no=transaction_id,
            description=description
        )
        db.add(journal_entry)
        await db.flush()
        
        # Create debit journal line
        debit_line = JournalLine(
            entry_id=journal_entry.id,
            account_code=debit_account,
            debit=float(amount),
            credit=0,
            description=f"Debit {debit_account}"
        )
        db.add(debit_line)
        
        # Create credit journal line
        credit_line = JournalLine(
            entry_id=journal_entry.id,
            account_code=credit_account,
            debit=0,
            credit=float(amount),
            description=f"Credit {credit_account}"
        )
        db.add(credit_line)
        
        # Create ledger entries for both sides
        debit_ledger = LedgerEntry(
            transaction_id=transaction_id,
            journal_entry_id=journal_entry.id,
            account_code=debit_account,
            amount=float(amount),
            entry_type="debit",
            branch_id=branch_id,
            branch_code=branch_code,
            description=f"Debit {debit_account}"
        )
        db.add(debit_ledger)
        
        credit_ledger = LedgerEntry(
            transaction_id=transaction_id,
            journal_entry_id=journal_entry.id,
            account_code=credit_account,
            amount=float(amount),
            entry_type="credit",
            branch_id=branch_id,
            branch_code=branch_code,
            description=f"Credit {credit_account}"
        )
        db.add(credit_ledger)
        
        await db.commit()
        print(f"Transaction {transaction_id} posted successfully.")
        return True
        
    except Exception as e:
        await db.rollback()
        print(f"Transaction failed: {e}")
        return False

async def get_ledger_entries_for_account(db: AsyncSession, account_code: str, limit: int = 100) -> List[dict]:
    """
    Get ledger entries for a specific account.
    """
    stmt = (
        select(LedgerEntry)
        .where(LedgerEntry.account_code == account_code)
        .order_by(LedgerEntry.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()
    
    return [
        {
            "id": entry.id,
            "transaction_id": entry.transaction_id,
            "account_code": entry.account_code,
            "amount": float(entry.amount),
            "entry_type": entry.entry_type,
            "timestamp": entry.timestamp,
            "description": entry.description,
            "branch_code": entry.branch_code
        }
        for entry in entries
    ]

async def get_journal_entries_for_account(db: AsyncSession, account_code: str, limit: int = 100) -> List[dict]:
    """
    Get journal entries associated with a specific account.
    """
    stmt = (
        select(JournalLine)
        .where(JournalLine.account_code == account_code)
        .order_by(JournalLine.entry_id.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    lines = result.scalars().all()
    
    entry_ids = [line.entry_id for line in lines]
    
    if not entry_ids:
        return []
    
    stmt_entries = (
        select(JournalEntry)
        .where(JournalEntry.id.in_(entry_ids))
        .order_by(JournalEntry.id.desc())
    )
    result_entries = await db.execute(stmt_entries)
    journal_entries = result_entries.scalars().all()
    
    return [
        {
            "id": entry.id,
            "reference_no": entry.reference_no,
            "description": entry.description,
            "timestamp": entry.timestamp,
            "lines": [
                {
                    "account_code": line.account_code,
                    "debit": float(line.debit),
                    "credit": float(line.credit)
                }
                for line in entry.lines
            ]
        }
        for entry in journal_entries
    ]