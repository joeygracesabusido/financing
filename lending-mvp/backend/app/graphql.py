"""
GraphQL server for Lending MVP using Strawberry
"""

import strawberry
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime, date

from .database import get_async_session_local
from .database.pg_core_models import User, Customer, SavingsAccount, Loan, SavingsTransaction
from .database.pg_loan_models import LoanTransaction, LoanApplication, AmortizationSchedule, PGLoanProduct
from .database.pg_accounting_models import GLAccount, JournalEntry, JournalLine
from .database.pg_models import CustomerActivity, Collection, Branch


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
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    emailAddress: Optional[str] = None
    mobileNumber: Optional[str] = None
    customerCategory: Optional[str] = None
    kycStatus: Optional[str] = None
    riskScore: Optional[float] = None
    branch: Optional[str] = None
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class CustomerConnection:
    customers: List[CustomerNode]
    total: int


@strawberry.type
class SavingsAccountNode:
    id: str
    accountNumber: str
    balance: Decimal
    customerId: str
    accountType: str
    status: str
    openedAt: datetime
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class SavingsAccountConnection:
    accounts: List[SavingsAccountNode]
    total: int


@strawberry.type
class SavingsTransactionNode:
    id: str
    accountId: str
    amount: Decimal
    accountType: str
    reference: Optional[str] = None
    description: Optional[str] = None
    createdAt: datetime


@strawberry.type
class CollectionNode:
    id: str
    customerId: str
    amount: Decimal
    status: str
    dueDate: date
    createdAt: datetime


@strawberry.type
class CustomerActivityNode:
    id: str
    customerId: str
    activityType: str
    description: Optional[str] = None
    timestamp: datetime
    createdBy: Optional[str] = None


@strawberry.type
class LoanNode:
    id: str
    principal: Decimal
    status: str
    customerId: str
    productId: Optional[int] = None
    borrowerName: str = "Demo Borrower"
    productName: str = "Demo Product"
    termMonths: int = 12
    approvedPrincipal: Optional[Decimal] = None
    approvedRate: Optional[Decimal] = None
    createdAt: datetime = strawberry.field(default_factory=datetime.now)
    updatedAt: datetime = strawberry.field(default_factory=datetime.now)
    disbursedAt: Optional[datetime] = None
@strawberry.type
class LoanConnection:
    loans: List[LoanNode]
    total: int



@strawberry.type

@strawberry.type
class LoanConnection:
    loans: List[LoanNode]
    total: int
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
    accountType: str # asset, liability, equity, income, expense
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
    accountType: str # debit or credit
    reference: str
    createdAt: datetime


@strawberry.type
class CollectionBucket:
    label: str
    loanCount: int
    totalOutstanding: Decimal


@strawberry.type
class CollectionsDashboardNode:
    totalLoans: int
    totalOutstanding: Decimal
    buckets: List[CollectionBucket]
    totalCollections: Decimal = Decimal('0.00')
    pendingCollections: Decimal = Decimal('0.00')
    overdueCollections: Decimal = Decimal('0.00')
    collectedThisMonth: Decimal = Decimal('0.00')


@strawberry.type
class CollectionNode:
    id: str
    customerId: str
    amount: Decimal
    status: str
    dueDate: date
    createdAt: datetime


@strawberry.type
class AuditLogNode:
    id: str
    userId: str
    action: str
    resource: str
    timestamp: datetime


@strawberry.type
class AmortizationScheduleRow:
    month: int
    principalPayment: Decimal
    interestPayment: Decimal
    totalPayment: Decimal
    outstandingBalance: Decimal


@strawberry.type
class LoanAmortizationNode:
    id: str
    loanId: str
    principal: Decimal
    interestRate: Decimal
    termMonths: int
    amortizationSchedule: List[AmortizationScheduleRow]


@strawberry.type
class LoanProductNode:
    id: str
    name: str
    productCode: str
    description: Optional[str]
    interestRate: Decimal
    termMonths: int
    minLoanAmount: Decimal = Decimal('1000.00')
    maxLoanAmount: Decimal = Decimal('1000000.00')
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class FinancialMetricsNode:
    averageCollectionDays: float = 0.0
    collectionEfficiency: float = 100.0
    totalOutstanding: Decimal = Decimal('0.00')
    totalCollected: Decimal = Decimal('0.00')
    totalNPL: Decimal = Decimal('0.00')
    nplRatio: float = 0.0
    totalLLR: Decimal = Decimal('0.00')
    llrRatio: float = 0.0
    provisionedAmount: Decimal = Decimal('0.00')


@strawberry.type
class FinancialStatementNode:
    revenue: Decimal = Decimal('0.00')
    expenses: Decimal = Decimal('0.00')
    profit: Decimal = Decimal('0.00')
    assets: Decimal = Decimal('0.00')
    liabilities: Decimal = Decimal('0.00')
    equity: Decimal = Decimal('0.00')
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


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
    async def health(self) -> Health:
        return Health(status="ok", message="Lending MVP GraphQL API is running")

    @strawberry.field
    async def customers(
        self, 
        skip: int = 0, 
        limit: int = 100,
        searchTerm: Optional[str] = None
    ) -> CustomerConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            query = select(Customer).offset(skip).limit(limit)
            if searchTerm:
                query = query.where(Customer.display_name.ilike(f"%{searchTerm}%"))
            
            result = await session.execute(query)
            customers = result.scalars().all()
            
            customer_count = await session.execute(select(func.count()).select_from(Customer))
            total = customer_count.scalar()
            
            return CustomerConnection(
                customers=[
                    CustomerNode(
                        id=str(c.id), 
                        displayName=c.display_name, 
                        customerType=c.customer_type, 
                        branchCode=c.branch_code, 
                        isActive=c.is_active,
                        firstName=c.first_name,
                        lastName=c.last_name,
                        emailAddress=c.email_address,
                        mobileNumber=c.mobile_number,
                        createdAt=c.created_at
                    ) for c in customers
                ],
                total=total
            )

    @strawberry.field
    async def customer(self, id: strawberry.ID) -> Optional[CustomerNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(Customer).where(Customer.id == str(id)))
            c = result.scalar_one_or_none()
            if not c: return None
            return CustomerNode(id=str(c.id), displayName=c.display_name, customerType=c.customer_type, branchCode=c.branch_code, isActive=c.is_active, firstName=c.first_name, lastName=c.last_name, emailAddress=c.email_address, mobileNumber=c.mobile_number, createdAt=c.created_at)

    @strawberry.field
    async def loans(
        self, 
        skip: int = 0, 
        limit: int = 100,
        customerId: Optional[str] = None,
        searchTerm: Optional[str] = None
    ) -> LoanConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(LoanApplication)
            if customerId: stmt = stmt.where(LoanApplication.customer_id == customerId)
            if searchTerm:
                stmt = stmt.where(LoanApplication.borrower_name.ilike(f"%{searchTerm}%"))
            
            result = await session.execute(stmt.offset(skip).limit(limit))
            loan_list = result.scalars().all()
            
            loan_count = await session.execute(select(func.count()).select_from(LoanApplication))
            total = loan_count.scalar()
            
            return LoanConnection(
                loans=[
                    LoanNode(
                        id=str(l.id),
                        principal=l.principal,
                        status=l.status,
                        customerId=str(l.customer_id),
                        productId=l.product_id,
                        termMonths=l.term_months,
                        approvedPrincipal=l.approved_principal,
                        approvedRate=l.approved_rate,
                        createdAt=l.created_at,
                        updatedAt=l.updated_at,
                        disbursedAt=l.disbursed_at
                    ) for l in loan_list
                ],
                total=total
            )

    @strawberry.field
    async def loan(self, id: strawberry.ID) -> Optional[LoanNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(LoanApplication).where(LoanApplication.id == int(id)))
            l = result.scalar_one_or_none()
            if not l: return None
            return LoanNode(id=str(l.id), principal=l.principal, status=l.status, customerId=str(l.customer_id), productId=l.product_id, termMonths=l.term_months, approvedPrincipal=l.approved_principal, approvedRate=l.approved_rate, createdAt=l.created_at, updatedAt=l.updated_at, disbursedAt=l.disbursed_at)

    @strawberry.field
    async def loanTransactions(self, loanId: strawberry.ID) -> List[LoanTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(LoanTransaction).where(LoanTransaction.loan_id == int(loanId)))
            txs = result.scalars().all()
            return [LoanTransactionNode(id=str(t.id), loanId=str(t.loan_id), amount=t.amount, transactionType=t.type, description=t.description, reference=t.receipt_number, createdAt=t.timestamp) for t in txs]

    @strawberry.field
    async def savingsAccounts(
        self, 
        skip: int = 0, 
        limit: int = 100,
        customerId: Optional[str] = None,
        searchTerm: Optional[str] = None
    ) -> SavingsAccountConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(SavingsAccount)
            if customerId: stmt = stmt.where(SavingsAccount.customer_id == customerId)
            if searchTerm:
                stmt = stmt.where(SavingsAccount.account_number.ilike(f"%{searchTerm}%"))
            
            result = await session.execute(stmt.offset(skip).limit(limit))
            accounts = result.scalars().all()
            
            account_count = await session.execute(select(func.count()).select_from(SavingsAccount))
            total = account_count.scalar()
            
            return SavingsAccountConnection(
                accounts=[
                    SavingsAccountNode(
                        id=str(a.id),
                        accountNumber=a.account_number,
                        balance=a.balance,
                        customerId=str(a.customer_id),
                        accountType=a.account_type,
                        status=a.status,
                        openedAt=a.opened_at
                    ) for a in accounts
                ],
                total=total
            )

    @strawberry.field
    async def savingsTransactions(self, accountId: strawberry.ID) -> List[SavingsTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(SavingsTransaction).where(SavingsTransaction.account_id == int(accountId))
            )
            transactions = result.scalars().all()
            return [
                SavingsTransactionNode(
                    id=str(t.id),
                    accountId=str(t.account_id),
                    amount=t.amount,
                    type=t.transaction_type,
                    reference=t.reference,
                    description=t.description,
                    createdAt=t.created_at
                )
                for t in transactions
            ]

    @strawberry.field
    async def customerActivities(self, customerId: str) -> List[CustomerActivityNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(CustomerActivity).where(CustomerActivity.customer_id == customerId)
            )
            activities = result.scalars().all()
            return [
                CustomerActivityNode(
                    id=str(a.id),
                    customerId=str(a.customer_id),
                    activityType=a.action,
                    description=a.detail,
                    timestamp=a.created_at,
                    createdBy=a.actor_username or "system"
                )
                for a in activities
            ]

    @strawberry.field
    async def collections(self) -> List[CollectionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(Collection))
            collections = result.scalars().all()
            return [
                CollectionNode(
                    id=str(c.id),
                    customerId=str(c.customer_id),
                    amount=c.amount,
                    status=c.status,
                    dueDate=c.due_date,
                    createdAt=c.created_at
                )
                for c in collections
            ]

    @strawberry.field
    async def collectionDue(self) -> Optional[CollectionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            today = date.today()
            result = await session.execute(
                select(Collection).where(Collection.due_date <= today)
            )
            collection = result.scalar_one_or_none()
            if not collection:
                return None
            return CollectionNode(
                id=str(collection.id),
                customerId=str(collection.customer_id),
                amount=collection.amount,
                status=collection.status,
                dueDate=collection.due_date,
                createdAt=collection.created_at
            )

    @strawberry.field
    async def glAccounts(self) -> List[GLAccountNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(GLAccount, func.sum(JournalLine.debit).label("total_debit"), func.sum(JournalLine.credit).label("total_credit")).outerjoin(JournalLine, GLAccount.code == JournalLine.account_code).group_by(GLAccount.id)
            result = await session.execute(stmt)
            rows = result.all()
            nodes = []
            for row in rows:
                acc = row[0]
                total_debit = row[1] or Decimal('0.00')
                total_credit = row[2] or Decimal('0.00')
                balance = (total_debit - total_credit) if acc.type.lower() in ['asset', 'expense'] else (total_credit - total_debit)
                nodes.append(GLAccountNode(id=str(acc.id), accountNumber=acc.code, name=acc.name, type=acc.type, balance=balance, createdAt=acc.created_at))
            return nodes

    @strawberry.field
    async def collectionsDashboard(self) -> CollectionsDashboardNode:
        session_factory = get_async_session_local()
        today = date.today()
        first_day_of_month = today.replace(day=1)
        async with session_factory() as session:
            # 1. Dashboard Metrics
            total_collections = (await session.execute(select(func.sum(AmortizationSchedule.principal_paid + AmortizationSchedule.interest_paid)))).scalar() or Decimal('0.00')
            pending_collections = (await session.execute(select(func.sum(AmortizationSchedule.principal_due + AmortizationSchedule.interest_due - AmortizationSchedule.principal_paid - AmortizationSchedule.interest_paid)).where(AmortizationSchedule.due_date >= today))).scalar() or Decimal('0.00')
            overdue_collections = (await session.execute(select(func.sum(AmortizationSchedule.principal_due + AmortizationSchedule.interest_due - AmortizationSchedule.principal_paid - AmortizationSchedule.interest_paid)).where(AmortizationSchedule.due_date < today))).scalar() or Decimal('0.00')
            collected_this_month = (await session.execute(select(func.sum(AmortizationSchedule.principal_paid + AmortizationSchedule.interest_paid)).where(AmortizationSchedule.due_date >= first_day_of_month))).scalar() or Decimal('0.00')
            
            # 2. Aging Buckets (Simplified logic based on overdue installments)
            # Fetch all unpaid installments to bucketize
            stmt = select(AmortizationSchedule).where(AmortizationSchedule.status != 'paid')
            unpaid = (await session.execute(stmt)).scalars().all()
            
            buckets = {
                'Current': {'count': 0, 'amount': Decimal('0.00')},
                '1-30 DPD': {'count': 0, 'amount': Decimal('0.00')},
                '31-60 DPD': {'count': 0, 'amount': Decimal('0.00')},
                '61-90 DPD': {'count': 0, 'amount': Decimal('0.00')},
                '90+ DPD': {'count': 0, 'amount': Decimal('0.00')}
            }
            
            loan_ids_counted = set()
            total_loans_count = (await session.execute(select(func.count(LoanApplication.id)))).scalar() or 0
            total_outstanding_stmt = select(func.sum(AmortizationSchedule.principal_due + AmortizationSchedule.interest_due - AmortizationSchedule.principal_paid - AmortizationSchedule.interest_paid))
            total_outstanding = (await session.execute(total_outstanding_stmt)).scalar() or Decimal('0.00')

            for item in unpaid:
                days_past_due = (today - item.due_date).days
                amount_due = item.principal_due + item.interest_due - item.principal_paid - item.interest_paid
                
                label = 'Current'
                if days_past_due > 90: label = '90+ DPD'
                elif days_past_due > 60: label = '61-90 DPD'
                elif days_past_due > 30: label = '31-60 DPD'
                elif days_past_due > 0: label = '1-30 DPD'
                
                buckets[label]['amount'] += amount_due
                buckets[label]['count'] += 1 # In a real system this would be per loan, but using per installment for simplicity
                
            bucket_nodes = [
                CollectionBucket(label=k, loanCount=v['count'], totalOutstanding=v['amount'])
                for k, v in buckets.items()
            ]
            
            return CollectionsDashboardNode(
                totalLoans=total_loans_count,
                totalOutstanding=total_outstanding,
                buckets=bucket_nodes,
                totalCollections=total_collections,
                pendingCollections=pending_collections,
                overdueCollections=overdue_collections,
                collectedThisMonth=collected_this_month
            )

    @strawberry.field
    async def auditLogs(self, limit: int = 50, offset: int = 0) -> List[AuditLogNode]: return []

    @strawberry.field
    async def loanAmortization(self, loanId: strawberry.ID) -> Optional[LoanAmortizationNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            l = (await session.execute(select(LoanApplication).where(LoanApplication.id == int(loanId)))).scalar_one_or_none()
            if not l: return None
            sched_items = (await session.execute(select(AmortizationSchedule).where(AmortizationSchedule.loan_id == l.id).order_by(AmortizationSchedule.installment_number))).scalars().all()
            rows, balance = [], l.principal
            for item in sched_items:
                balance -= item.principal_paid
                rows.append(AmortizationScheduleRow(month=item.installment_number, principalPayment=item.principal_due, interestPayment=item.interest_due, totalPayment=item.principal_due + item.interest_due, outstandingBalance=balance))
            return LoanAmortizationNode(id=str(l.id), loanId=str(l.id), principal=l.principal, interestRate=l.approved_rate or Decimal('12.00'), termMonths=l.term_months, amortizationSchedule=rows)

    @strawberry.field
    async def loanProducts(self) -> List[LoanProductNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            prods = (await session.execute(select(PGLoanProduct))).scalars().all()
            return [LoanProductNode(id=str(p.id), name=p.name, productCode=p.product_code, description=p.description, interestRate=p.interest_rate, termMonths=12, createdAt=p.created_at) for p in prods]

    @strawberry.field
    async def parMetrics(self) -> FinancialMetricsNode: return FinancialMetricsNode()
    @strawberry.field
    async def nplMetrics(self) -> FinancialMetricsNode: return FinancialMetricsNode()
    @strawberry.field
    async def llrMetrics(self) -> FinancialMetricsNode: return FinancialMetricsNode()
    @strawberry.field
    async def incomeStatement(self, year: int, month: int) -> FinancialStatementNode: return FinancialStatementNode()
    @strawberry.field
    async def balanceSheet(self, year: int, month: int) -> FinancialStatementNode: return FinancialStatementNode()
    @strawberry.field
    async def unresolvedAlerts(self) -> List[Health]: return [] # Placeholder
    @strawberry.field
    async def complianceReports(self) -> List[Health]: return [] # Placeholder

    @strawberry.field
    async def journalEntries(self, limit: int = 50, offset: int = 0) -> List[JournalEntryNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            totals_stmt = select(JournalLine.entry_id, func.sum(JournalLine.debit).label("total_debit"), func.sum(JournalLine.credit).label("total_credit")).group_by(JournalLine.entry_id).subquery()
            stmt = select(JournalEntry, totals_stmt.c.total_debit, totals_stmt.c.total_credit).outerjoin(totals_stmt, JournalEntry.id == totals_stmt.c.entry_id).order_by(JournalEntry.timestamp.desc()).offset(offset).limit(limit)
            result = await session.execute(stmt)
            rows = result.all()
            return [JournalEntryNode(id=str(r[0].id), date=r[0].timestamp, description=r[0].description, reference=r[0].reference_no, debit=r[1] or Decimal('0.00'), credit=r[2] or Decimal('0.00'), createdAt=r[0].timestamp) for r in rows]

    @strawberry.field
    async def journalEntryByReference(self, reference: str) -> Optional[JournalEntryNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            totals_stmt = select(JournalLine.entry_id, func.sum(JournalLine.debit).label("total_debit"), func.sum(JournalLine.credit).label("total_credit")).group_by(JournalLine.entry_id).subquery()
            stmt = select(JournalEntry, totals_stmt.c.total_debit, totals_stmt.c.total_credit).outerjoin(totals_stmt, JournalEntry.id == totals_stmt.c.entry_id).where(JournalEntry.reference_no == reference)
            r = (await session.execute(stmt)).first()
            if not r: return None
            return JournalEntryNode(id=str(r[0].id), date=r[0].timestamp, description=r[0].description, reference=r[0].reference_no, debit=r[1] or Decimal('0.00'), credit=r[2] or Decimal('0.00'), createdAt=r[0].timestamp)

    @strawberry.field
    async def glAccountTransactions(self, accountId: strawberry.ID) -> List[GLTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            acc = (await session.execute(select(GLAccount).where(GLAccount.id == int(accountId)))).scalar_one_or_none()
            if not acc: return []
            rows = (await session.execute(select(JournalLine, JournalEntry).join(JournalEntry).where(JournalLine.account_code == acc.code).order_by(JournalEntry.timestamp.desc()))).all()
            return [GLTransactionNode(id=str(l.id), accountId=str(acc.id), amount=l.debit if l.debit > 0 else l.credit, type='debit' if l.debit > 0 else 'credit', reference=e.reference_no, createdAt=e.timestamp) for l, e in rows]

    @strawberry.field
    async def dashboardStats(self) -> DashboardStats:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            customer_count = (await session.execute(select(func.count(Customer.id)))).scalar() or 0
            loan_count = (await session.execute(select(func.count(LoanApplication.id)))).scalar() or 0
            return DashboardStats(customersTotal=customer_count, loansTotal=loan_count)


@strawberry.type
class MutationResponse:
    success: bool
    message: str


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_dummy(self) -> MutationResponse: return MutationResponse(success=True, message="Placeholder")
    @strawberry.mutation
    async def submit_loan(self, loanId: strawberry.ID) -> MutationResponse: return MutationResponse(success=True, message="Loan submitted for review")
    @strawberry.mutation
    async def approve_loan(self, id: strawberry.ID, approvedPrincipal: Optional[Decimal] = None, approvedRate: Optional[Decimal] = None) -> MutationResponse: return MutationResponse(success=True, message="Loan approved")
    @strawberry.mutation
    async def disburse_loan(self, loanId: strawberry.ID, amount: Optional[float] = None) -> MutationResponse: return MutationResponse(success=True, message="Loan disbursed")


schema = strawberry.Schema(query=Query, mutation=Mutation)