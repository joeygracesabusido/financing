"""
GraphQL types, queries, and mutations for Chart of Accounts & GL management.
Phase 2.5 — Loan Accounting (Double-Entry)
"""
import strawberry
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from strawberry.types import Info
from fastapi import HTTPException, status
from sqlalchemy.future import select

from .models import UserInDB
from .database.pg_models import get_db_session
from .database.pg_accounting_models import GLAccount, JournalEntry, JournalLine

# ── Default Chart of Accounts ────────────────────────────────────────────

DEFAULT_COA = [
    # Assets
    {"code": "1000", "name": "Cash on Hand", "type": "asset"},
    {"code": "1010", "name": "Cash in Bank", "type": "asset"},
    {"code": "1100", "name": "Accounts Receivable", "type": "asset"},
    {"code": "1300", "name": "Loans Receivable", "type": "asset"},
    {"code": "1400", "name": "Allowance for Loan Losses", "type": "asset"},
    {"code": "1500", "name": "Fixed Assets", "type": "asset"},
    {"code": "1600", "name": "Accumulated Depreciation", "type": "asset"},
    # Liabilities
    {"code": "2000", "name": "Accounts Payable", "type": "liability"},
    {"code": "2010", "name": "Savings Deposits Payable", "type": "liability"},
    {"code": "2100", "name": "Customer Advances (Overpayments)", "type": "liability"},
    {"code": "2200", "name": "Withholding Tax Payable", "type": "liability"},
    {"code": "2300", "name": "Other Liabilities", "type": "liability"},
    # Equity
    {"code": "3000", "name": "Share Capital", "type": "equity"},
    {"code": "3100", "name": "Retained Earnings", "type": "equity"},
    # Income
    {"code": "4000", "name": "Interest Income — Savings", "type": "income"},
    {"code": "4100", "name": "Interest Income — Loans", "type": "income"},
    {"code": "4200", "name": "Fee Income — Origination", "type": "income"},
    {"code": "4300", "name": "Penalty Income", "type": "income"},
    {"code": "4400", "name": "Prepayment Penalty Income", "type": "income"},
    {"code": "4500", "name": "Service Fee Income", "type": "income"},
    # Expenses
    {"code": "5000", "name": "Salaries & Wages", "type": "expense"},
    {"code": "5100", "name": "Office & Administrative Expenses", "type": "expense"},
    {"code": "5200", "name": "Loan Loss Expense (Provision)", "type": "expense"},
    {"code": "5300", "name": "Depreciation Expense", "type": "expense"},
    {"code": "5400", "name": "Interest Expense", "type": "expense"},
]


async def seed_chart_of_accounts():
    """Seed the standard Chart of Accounts if empty."""
    from .database.pg_models import get_db_session as gds
    async for session in gds():
        result = await session.execute(select(GLAccount).limit(1))
        if result.scalar_one_or_none():
            return  # Already seeded

        for acct in DEFAULT_COA:
            session.add(GLAccount(
                code=acct["code"],
                name=acct["name"],
                type=acct["type"],
            ))
        await session.commit()


# ── GraphQL Types ────────────────────────────────────────────────────────

@strawberry.type
class GLAccountType:
    id: strawberry.ID
    code: str
    name: str
    type: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


@strawberry.input
class GLAccountCreateInput:
    code: str
    name: str
    type: str        # asset | liability | equity | income | expense
    description: Optional[str] = None


@strawberry.input
class GLAccountUpdateInput:
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None


@strawberry.type
class GLAccountResponse:
    success: bool
    message: str
    account: Optional[GLAccountType] = None


@strawberry.type
class JournalLineType:
    id: strawberry.ID
    account_code: str
    debit: Decimal
    credit: Decimal
    description: Optional[str]


@strawberry.type
class JournalEntryType:
    id: strawberry.ID
    reference_no: str
    description: Optional[str]
    timestamp: datetime
    created_by: Optional[str]
    lines: List[JournalLineType]


@strawberry.type
class JournalEntriesResponse:
    success: bool
    message: str
    entries: List[JournalEntryType]
    total: int


def _gl_db_to_type(acct: GLAccount) -> GLAccountType:
    return GLAccountType(
        id=strawberry.ID(str(acct.id)),
        code=acct.code,
        name=acct.name,
        type=acct.type,
        description=acct.description,
        created_at=acct.created_at,
        updated_at=acct.updated_at,
    )


# ── Queries ──────────────────────────────────────────────────────────────

@strawberry.type
class ChartOfAccountsQuery:
    @strawberry.field
    async def gl_accounts(self, info: Info) -> List[GLAccountType]:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        async for session in get_db_session():
            result = await session.execute(select(GLAccount).order_by(GLAccount.code))
            return [_gl_db_to_type(a) for a in result.scalars().all()]

    @strawberry.field
    async def gl_account(self, info: Info, id: strawberry.ID) -> Optional[GLAccountType]:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        async for session in get_db_session():
            result = await session.execute(select(GLAccount).filter(GLAccount.id == int(id)))
            acct = result.scalar_one_or_none()
            return _gl_db_to_type(acct) if acct else None

    @strawberry.field
    async def journal_entries(self, info: Info, skip: int = 0, limit: int = 50) -> JournalEntriesResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            count_result = await session.execute(select(JournalEntry))
            total = len(count_result.scalars().all())

            result = await session.execute(
                select(JournalEntry)
                .order_by(JournalEntry.timestamp.desc())
                .offset(skip)
                .limit(limit)
            )
            entries = []
            for entry in result.scalars().all():
                lines_result = await session.execute(
                    select(JournalLine).filter(JournalLine.entry_id == entry.id)
                )
                lines = [
                    JournalLineType(
                        id=strawberry.ID(str(l.id)),
                        account_code=l.account_code,
                        debit=l.debit,
                        credit=l.credit,
                        description=l.description,
                    )
                    for l in lines_result.scalars().all()
                ]
                entries.append(JournalEntryType(
                    id=strawberry.ID(str(entry.id)),
                    reference_no=entry.reference_no,
                    description=entry.description,
                    timestamp=entry.timestamp,
                    created_by=entry.created_by,
                    lines=lines,
                ))

            return JournalEntriesResponse(success=True, message="OK", entries=entries, total=total)


# ── Mutations ────────────────────────────────────────────────────────────

@strawberry.type
class ChartOfAccountsMutation:
    @strawberry.mutation
    async def create_gl_account(self, info: Info, input: GLAccountCreateInput) -> GLAccountResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can manage GL accounts")

        async for session in get_db_session():
            existing = await session.execute(select(GLAccount).filter(GLAccount.code == input.code))
            if existing.scalar_one_or_none():
                return GLAccountResponse(success=False, message=f"Account code {input.code} already exists")

            new_acct = GLAccount(
                code=input.code,
                name=input.name,
                type=input.type,
                description=input.description,
            )
            session.add(new_acct)
            await session.flush()
            await session.refresh(new_acct)
            return GLAccountResponse(success=True, message="GL account created", account=_gl_db_to_type(new_acct))

    @strawberry.mutation
    async def update_gl_account(self, info: Info, id: strawberry.ID, input: GLAccountUpdateInput) -> GLAccountResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can manage GL accounts")

        async for session in get_db_session():
            result = await session.execute(select(GLAccount).filter(GLAccount.id == int(id)))
            acct = result.scalar_one_or_none()
            if not acct:
                return GLAccountResponse(success=False, message="Account not found")

            if input.name is not None:
                acct.name = input.name
            if input.type is not None:
                acct.type = input.type
            if input.description is not None:
                acct.description = input.description

            await session.flush()
            await session.refresh(acct)
            return GLAccountResponse(success=True, message="GL account updated", account=_gl_db_to_type(acct))
