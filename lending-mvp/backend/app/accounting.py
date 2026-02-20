from decimal import Decimal
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session
from .database.pg_accounting_models import JournalEntry, JournalLine
import uuid

async def create_journal_entry(
    session: Session,
    reference_no: str,
    description: str,
    lines: List[Dict[str, any]],
    created_by: str = None
) -> JournalEntry:
    """
    Creates a double-entry journal record.
    `lines` should be a list of dicts: [
        {"account_code": "1000", "debit": 1000.00, "credit": 0.00},
        {"account_code": "4000", "debit": 0.00, "credit": 1000.00}
    ]
    """
    total_debit = sum(Decimal(str(line.get("debit", 0))) for line in lines)
    total_credit = sum(Decimal(str(line.get("credit", 0))) for line in lines)
    
    if total_debit != total_credit:
        raise ValueError(f"Journal entry unbalanced: Debits {total_debit} != Credits {total_credit}")

    if not reference_no:
        reference_no = f"JNL-{uuid.uuid4().hex[:8].upper()}"

    entry = JournalEntry(
        reference_no=reference_no,
        description=description,
        created_by=created_by
    )
    session.add(entry)
    await session.flush()

    for line_data in lines:
        line = JournalLine(
            entry_id=entry.id,
            account_code=line_data["account_code"],
            debit=line_data.get("debit", 0),
            credit=line_data.get("credit", 0),
            description=line_data.get("description", "")
        )
        session.add(line)

    await session.flush()
    return entry
