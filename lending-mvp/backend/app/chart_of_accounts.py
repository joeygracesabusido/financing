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
from .database.postgres import get_db_session
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
    from .database.postgres import get_db_session as gds
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
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")

    @strawberry.field
    async def balance(self, info: Info) -> Decimal:
        from sqlalchemy import func
        async for session in get_db_session():
            result = await session.execute(
                select(
                    func.sum(JournalLine.debit).label("total_debit"),
                    func.sum(JournalLine.credit).label("total_credit")
                ).filter(JournalLine.account_code == self.code)
            )
            stats = result.one()
            debit = stats.total_debit or Decimal("0.00")
            credit = stats.total_credit or Decimal("0.00")

            # Normal Balance rules:
            # Asset & Expense: Debit (+) - Credit (-)
            # Liability, Equity, Income: Credit (+) - Debit (-)
            if self.type in ["asset", "expense"]:
                return debit - credit
            else:
                return credit - debit
        return Decimal("0.00")


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


@strawberry.input
class JournalLineInput:
    account_code: str = strawberry.field(name="accountCode")
    debit: Decimal
    credit: Decimal
    description: Optional[str] = None


@strawberry.input
class JournalEntryCreateInput:
    reference_no: str = strawberry.field(name="referenceNo")
    description: str
    lines: List[JournalLineInput]


@strawberry.type
class JournalLineType:
    id: strawberry.ID
    account_code: str = strawberry.field(name="accountCode")
    account_name: Optional[str] = strawberry.field(name="accountName")
    debit: Decimal
    credit: Decimal
    description: Optional[str]


@strawberry.type
class JournalEntryType:
    id: strawberry.ID
    reference_no: str = strawberry.field(name="referenceNo")
    description: Optional[str]
    timestamp: datetime
    created_by: Optional[str] = strawberry.field(name="createdBy")
    lines: List[JournalLineType]


@strawberry.type
class JournalEntryResponse:
    success: bool
    message: str
    entry: Optional[JournalEntryType] = None


@strawberry.type
class GLAccountResponse:
    success: bool
    message: str
    account: Optional[GLAccountType] = None


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
    async def journal_entries(self, info: Info, skip: int = 0, limit: int = 50, referenceNo: Optional[str] = None) -> JournalEntriesResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            query = select(JournalEntry)
            if referenceNo:
                query = query.filter(JournalEntry.reference_no == referenceNo)
            
            count_result = await session.execute(query)
            # This is inefficient for large tables but okay for MVP/POC
            all_entries = count_result.scalars().all()
            total = len(all_entries)

            result = await session.execute(
                query
                .order_by(JournalEntry.timestamp.desc())
                .offset(skip)
                .limit(limit)
            )
            entries = []
            from sqlalchemy.orm import joinedload
            for entry in result.scalars().all():
                lines_result = await session.execute(
                    select(JournalLine)
                    .options(joinedload(JournalLine.account))
                    .filter(JournalLine.entry_id == entry.id)
                )
                lines = [
                    JournalLineType(
                        id=strawberry.ID(str(l.id)),
                        account_code=l.account_code,
                        account_name=l.account.name if l.account else None,
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

    @strawberry.field
    async def journal_entry_by_reference(self, info: Info, referenceNo: str) -> Optional[JournalEntryType]:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role in ["customer"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        async for session in get_db_session():
            result = await session.execute(
                select(JournalEntry).filter(JournalEntry.reference_no == referenceNo)
            )
            entry = result.scalar_one_or_none()
            if not entry:
                return None

            from sqlalchemy.orm import joinedload
            lines_result = await session.execute(
                select(JournalLine)
                .options(joinedload(JournalLine.account))
                .filter(JournalLine.entry_id == entry.id)
            )
            lines = [
                JournalLineType(
                    id=strawberry.ID(str(l.id)),
                    account_code=l.account_code,
                    account_name=l.account.name if l.account else None,
                    debit=l.debit,
                    credit=l.credit,
                    description=l.description,
                )
                for l in lines_result.scalars().all()
            ]
            return JournalEntryType(
                id=strawberry.ID(str(entry.id)),
                reference_no=entry.reference_no,
                description=entry.description,
                timestamp=entry.timestamp,
                created_by=entry.created_by,
                lines=lines,
            )


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

    @strawberry.mutation
    async def create_manual_journal_entry(self, info: Info, input: JournalEntryCreateInput) -> JournalEntryResponse:
        current_user: UserInDB = info.context.get("current_user")
        if not current_user or current_user.role != "admin":
            return JournalEntryResponse(success=False, message="Only admin can post manual journal entries")

        # 1. Balance Validation
        total_debit = sum(line.debit for line in input.lines)
        total_credit = sum(line.credit for line in input.lines)

        if total_debit != total_credit:
            return JournalEntryResponse(
                success=False, 
                message=f"Journal entry is not balanced. Total Debit ({total_debit}) must equal Total Credit ({total_credit})."
            )

        if len(input.lines) < 2:
            return JournalEntryResponse(success=False, message="Journal entry must have at least two lines.")

        from .accounting import create_journal_entry
        from sqlalchemy.orm import selectinload
        
        async for session in get_db_session():
            try:
                # Convert strawberry input to dict format expected by create_journal_entry
                lines_data = [
                    {
                        "account_code": l.account_code,
                        "debit": l.debit,
                        "credit": l.credit,
                        "description": l.description
                    } for l in input.lines
                ]

                entry_db_id = (await create_journal_entry(
                    session=session,
                    reference_no=input.reference_no,
                    description=input.description,
                    lines=lines_data,
                    created_by=str(current_user.id)
                )).id
                await session.commit()

                # Re-fetch with selectinload to avoid "greenlet_spawn" error
                result = await session.execute(
                    select(JournalEntry)
                    .options(
                        selectinload(JournalEntry.lines).selectinload(JournalLine.account)
                    )
                    .filter(JournalEntry.id == entry_db_id)
                )
                entry_db = result.scalar_one()

                # Convert DB model back to GraphQL type
                lines_type = [
                    JournalLineType(
                        id=strawberry.ID(str(l.id)),
                        account_code=l.account_code,
                        account_name=l.account.name if l.account else None,
                        debit=l.debit,
                        credit=l.credit,
                        description=l.description
                    ) for l in entry_db.lines
                ]

                return JournalEntryResponse(
                    success=True,
                    message="Manual journal entry posted successfully",
                    entry=JournalEntryType(
                        id=strawberry.ID(str(entry_db.id)),
                        reference_no=entry_db.reference_no,
                        description=entry_db.description,
                        timestamp=entry_db.timestamp,
                        created_by=entry_db.created_by,
                        lines=lines_type
                    )
                )
            except Exception as e:
                await session.rollback()
                return JournalEntryResponse(success=False, message=f"Error posting journal entry: {str(e)}")
