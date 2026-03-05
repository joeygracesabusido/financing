from decimal import Decimal
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database.pg_accounting_models import JournalEntry, JournalLine, GLAccount
import uuid

async def ensure_gl_account(session: Session, code: str, name: str, acc_type: str):
    """Ensure a GL account exists, create if not."""
    result = await session.execute(
        select(GLAccount).filter(GLAccount.code == code)
    )
    existing = result.scalar_one_or_none()
    if not existing:
        new_account = GLAccount(code=code, name=name, type=acc_type)
        session.add(new_account)
        await session.flush()

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
    # Ensure all account codes exist
    account_map: Dict[str, tuple] = {
        "1000": ("Cash on Hand", "asset"),
        "1005": ("Petty Cash", "asset"),
        "1010": ("Cash in Bank", "asset"),
        "1100": ("Accounts Receivable", "asset"),
        "1200": ("Loans Receivable - Current", "asset"),
        "1300": ("Loans Receivable - Non-Current", "asset"),
        "1400": ("Allowance for Loan Losses", "asset"),
        "1500": ("Fixed Assets", "asset"),
        "1600": ("Accumulated Depreciation", "asset"),
        "2000": ("Accounts Payable", "liability"),
        "2010": ("Disbursement Payable", "liability"),
        "2020": ("Savings Deposits Payable", "liability"),
        "2100": ("Customer Advances", "liability"),
        "2200": ("Withholding Tax Payable", "liability"),
        "2300": ("Other Liabilities", "liability"),
        "3000": ("Share Capital", "equity"),
        "3100": ("Retained Earnings", "equity"),
        "4000": ("Interest Income - Savings", "income"),
        "4100": ("Interest Income - Loans", "income"),
        "4200": ("Fee Income - Origination", "income"),
        "4300": ("Penalty Income", "income"),
        "4400": ("Prepayment Penalty Income", "income"),
        "4500": ("Service Fee Income", "income"),
        "5000": ("Salaries & Wages", "expense"),
        "5100": ("Office & Administrative Expenses", "expense"),
        "5200": ("Loan Loss Expense", "expense"),
        "5300": ("Depreciation Expense", "expense"),
        "5400": ("Interest Expense", "expense"),
    }
    
    for line in lines:
        code = line.get("account_code")
        if code and code in account_map:
            await ensure_gl_account(session, code, account_map[code][0], account_map[code][1])
    
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
