"""
GraphQL server for Lending MVP using Strawberry
"""

import strawberry
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime

from .database import get_async_session_local
from .database.pg_core_models import User, Customer, SavingsAccount, Loan
from .database.pg_loan_models import LoanTransaction, LoanApplication
from .database.pg_accounting_models import GLAccount, JournalEntry, JournalLine


@strawberry.type
class Health:
    status: str
    message: str


@strawberry.type
class DashboardStats:
    customersTotal: int
    loansTotal: int


@strawberry.type
class UserNode:
    id: str
    email: str
    username: str
    fullName: str
    isActive: bool
    role: str


@strawberry.type
class CustomerNode:
    id: str
    displayName: str
    customerType: str
    branchCode: str
    isActive: bool


@strawberry.type
class SavingsAccountNode:
    id: str
    accountNumber: str
    balance: Decimal
    customerId: str


@strawberry.type
class LoanNode:
    id: str
    principal: Decimal
    status: str
    customerId: str
    borrowerName: str = "Demo Borrower"
    productName: str = "Demo Product"
    termMonths: int = 12
    approvedPrincipal: Optional[Decimal] = None
    approvedRate: Optional[Decimal] = None
    createdAt: datetime = strawberry.field(default_factory=datetime.now)
    disbursedAt: Optional[datetime] = None


@strawberry.type
class LoanTransactionNode:
    id: str
    loanId: str
    amount: Decimal
    transactionType: str
    description: Optional[str] = None
    status: str = "success"
    reference: Optional[str] = None
    createdAt: datetime


@strawberry.type
class GLAccountNode:
    id: str
    accountNumber: str
    name: str
    type: str # asset, liability, equity, income, expense
    balance: Decimal
    createdAt: datetime


@strawberry.type
class JournalEntryNode:
    id: str
    date: datetime
    description: Optional[str]
    reference: str
    debit: Decimal
    credit: Decimal
    createdAt: datetime


@strawberry.type
class GLTransactionNode:
    id: str
    accountId: str
    amount: Decimal
    type: str # debit or credit
    reference: str
    createdAt: datetime


@strawberry.type
class Query:
    @strawberry.field
    async def users(self, skip: int = 0, limit: int = 100) -> List[UserNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(User).offset(skip).limit(limit)
            )
            users = result.scalars().all()
            return [
                UserNode(
                    id=str(u.uuid if u.uuid is not None else u.id),
                    email=u.email,
                    username=u.username,
                    fullName=u.full_name,
                    isActive=u.is_active,
                    role=u.role,
                )
                for u in users
            ]

    @strawberry.field
    async def customers(self, skip: int = 0, limit: int = 100) -> List[CustomerNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(Customer).offset(skip).limit(limit)
            )
            customers = result.scalars().all()
            return [
                CustomerNode(
                    id=str(c.id),
                    displayName=c.display_name,
                    customerType=c.customer_type,
                    branchCode=c.branch_code,
                    isActive=c.is_active,
                )
                for c in customers
            ]

    @strawberry.field
    async def loans(self, skip: int = 0, limit: int = 100, customerId: Optional[str] = None) -> List[LoanNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(LoanApplication)
            if customerId:
                stmt = stmt.where(LoanApplication.customer_id == customerId)
            
            result = await session.execute(stmt.offset(skip).limit(limit))
            loans = result.scalars().all()
            return [
                LoanNode(
                    id=str(l.id),
                    principal=l.principal,
                    status=l.status,
                    customerId=str(l.customer_id),
                    termMonths=l.term_months,
                    approvedPrincipal=l.approved_principal,
                    approvedRate=l.approved_rate,
                    createdAt=l.created_at,
                    disbursedAt=l.disbursed_at,
                )
                for l in loans
            ]

    @strawberry.field
    async def loan(self, id: strawberry.ID) -> Optional[LoanNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(LoanApplication).where(LoanApplication.id == int(id)))
            l = result.scalar_one_or_none()
            if not l:
                return None
            return LoanNode(
                id=str(l.id),
                principal=l.principal,
                status=l.status,
                customerId=str(l.customer_id),
                termMonths=l.term_months,
                approvedPrincipal=l.approved_principal,
                approvedRate=l.approved_rate,
                createdAt=l.created_at,
                disbursedAt=l.disbursed_at,
            )

    @strawberry.field
    async def loanTransactions(self, loanId: strawberry.ID) -> List[LoanTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(LoanTransaction).where(LoanTransaction.loan_id == int(loanId))
            )
            txs = result.scalars().all()
            return [
                LoanTransactionNode(
                    id=str(t.id),
                    loanId=str(t.loan_id),
                    amount=t.amount,
                    transactionType=t.type,
                    description=t.description,
                    reference=t.receipt_number,
                    createdAt=t.timestamp,
                )
                for t in txs
            ]

    @strawberry.field
    async def savingsAccounts(self, skip: int = 0, limit: int = 100, customerId: Optional[str] = None) -> List[SavingsAccountNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(SavingsAccount)
            if customerId:
                stmt = stmt.where(SavingsAccount.customer_id == customerId)
            
            result = await session.execute(stmt.offset(skip).limit(limit))
            accounts = result.scalars().all()
            return [
                SavingsAccountNode(
                    id=str(a.id),
                    accountNumber=a.account_number,
                    balance=a.balance,
                    customerId=str(a.customer_id),
                )
                for a in accounts
            ]

    @strawberry.field
    async def glAccounts(self) -> List[GLAccountNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            # Query accounts and their balances (sum of lines)
            stmt = select(
                GLAccount,
                func.sum(JournalLine.debit).label("total_debit"),
                func.sum(JournalLine.credit).label("total_credit")
            ).outerjoin(
                JournalLine, GLAccount.code == JournalLine.account_code
            ).group_by(GLAccount.id)
            
            result = await session.execute(stmt)
            rows = result.all()
            
            nodes = []
            for row in rows:
                acc = row[0]
                total_debit = row[1] or Decimal('0.00')
                total_credit = row[2] or Decimal('0.00')
                
                # Simple balance: Asset/Expense increases with debit, Liability/Equity/Income increases with credit
                if acc.type.lower() in ['asset', 'expense']:
                    balance = total_debit - total_credit
                else:
                    balance = total_credit - total_debit
                
                nodes.append(GLAccountNode(
                    id=str(acc.id),
                    accountNumber=acc.code,
                    name=acc.name,
                    type=acc.type,
                    balance=balance,
                    createdAt=acc.created_at
                ))
            return nodes

    @strawberry.field
    async def journalEntries(self, limit: int = 50, offset: int = 0) -> List[JournalEntryNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            # Subquery to get totals for each entry
            totals_stmt = select(
                JournalLine.entry_id,
                func.sum(JournalLine.debit).label("total_debit"),
                func.sum(JournalLine.credit).label("total_credit")
            ).group_by(JournalLine.entry_id).subquery()
            
            stmt = select(
                JournalEntry,
                totals_stmt.c.total_debit,
                totals_stmt.c.total_credit
            ).outerjoin(
                totals_stmt, JournalEntry.id == totals_stmt.c.entry_id
            ).order_by(JournalEntry.timestamp.desc()).offset(offset).limit(limit)
            
            result = await session.execute(stmt)
            rows = result.all()
            
            return [
                JournalEntryNode(
                    id=str(r[0].id),
                    date=r[0].timestamp,
                    description=r[0].description,
                    reference=r[0].reference_no,
                    debit=r[1] or Decimal('0.00'),
                    credit=r[2] or Decimal('0.00'),
                    createdAt=r[0].timestamp
                )
                for r in rows
            ]

    @strawberry.field
    async def glAccountTransactions(self, accountId: strawberry.ID) -> List[GLTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            # First find the account to get the code
            acc_result = await session.execute(select(GLAccount).where(GLAccount.id == int(accountId)))
            acc = acc_result.scalar_one_or_none()
            if not acc:
                return []
            
            # Join lines with entries for timestamp and reference
            stmt = select(JournalLine, JournalEntry).join(JournalEntry).where(JournalLine.account_code == acc.code).order_by(JournalEntry.timestamp.desc())
            result = await session.execute(stmt)
            rows = result.all()
            
            nodes = []
            for line, entry in rows:
                amount = line.debit if line.debit > 0 else line.credit
                type_ = 'debit' if line.debit > 0 else 'credit'
                
                nodes.append(GLTransactionNode(
                    id=str(line.id),
                    accountId=str(acc.id),
                    amount=amount,
                    type=type_,
                    reference=entry.reference_no,
                    createdAt=entry.timestamp
                ))
            return nodes

    @strawberry.field
    async def health(self) -> Health:
        return Health(status="ok", message="Lending MVP GraphQL API is running")

    @strawberry.field
    async def dashboardStats(self) -> DashboardStats:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            # Get real counts
            customer_count = await session.execute(select(func.count(Customer.id)))
            loan_count = await session.execute(select(func.count(LoanApplication.id)))
            
            return DashboardStats(
                customersTotal=customer_count.scalar() or 0,
                loansTotal=loan_count.scalar() or 0,
            )


@strawberry.type
class MutationResponse:
    success: bool
    message: str


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_dummy(self) -> MutationResponse:
        return MutationResponse(success=True, message="Placeholder")

    @strawberry.mutation
    async def submit_loan(self, loanId: strawberry.ID) -> MutationResponse:
        return MutationResponse(success=True, message="Loan submitted for review")

    @strawberry.mutation
    async def approve_loan(self, id: strawberry.ID, approvedPrincipal: Optional[Decimal] = None, approvedRate: Optional[Decimal] = None) -> MutationResponse:
        return MutationResponse(success=True, message="Loan approved")

    @strawberry.mutation
    async def disburse_loan(self, loanId: strawberry.ID, amount: Optional[float] = None) -> MutationResponse:
        return MutationResponse(success=True, message="Loan disbursed")


schema = strawberry.Schema(query=Query, mutation=Mutation)