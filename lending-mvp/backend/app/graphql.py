from __future__ import annotations

"""
GraphQL server for Lending MVP using Strawberry
"""

import strawberry
from fastapi import Request
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info
from decimal import Decimal
from datetime import datetime, date

from .database import get_async_session_local
from .database.pg_core_models import (
    User,
    Customer,
    SavingsAccount,
    Loan,
    SavingsTransaction,
)
from .database.pg_loan_models import (
    LoanTransaction,
    LoanApplication,
    AmortizationSchedule,
    PGLoanProduct,
)
from .database.pg_accounting_models import GLAccount, JournalEntry, JournalLine
from .chart_of_accounts import (
    JournalEntryCreateInput,
    JournalEntryResponse,
    GLAccountCreateInput,
    GLAccountResponse,
)
from .database.pg_models import (
    CustomerActivity,
    Collection,
    Branch,
    UserBranchAssignment,
)


from .auth.security import get_password_hash, verify_token
from .database.pg_user_crud import UserCRUD


async def get_context(request: Request = None):
    """
    GraphQL context provider.
    Extracts current user from JWT token in Authorization header.
    """
    context = {"current_user": None}
    if not request:
        return context

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = verify_token(token)
            user_id = payload.get("sub")
            if user_id:
                session_factory = get_async_session_local()
                async with session_factory() as session:
                    user_crud = UserCRUD(session)
                    # Check if user_id is a UUID or an integer ID
                    from sqlalchemy import or_

                    stmt = select(User).where(
                        or_(
                            User.uuid == str(user_id),
                            User.id == int(user_id)
                            if str(user_id).isdigit()
                            else False,
                        )
                    )
                    res = await session.execute(stmt)
                    user = res.scalar_one_or_none()
                    if user:
                        context["current_user"] = user
        except Exception:
            pass
    return context


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


@strawberry.input
class UserCreateInput:
    email: str
    username: str
    fullName: str
    password: str
    role: Optional[str] = "customer"
    branchId: Optional[int] = None
    branchCode: Optional[str] = None


@strawberry.input
class UserUpdateInput:
    email: Optional[str] = None
    username: Optional[str] = None
    fullName: Optional[str] = None
    isActive: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None
    branchId: Optional[int] = None
    branchCode: Optional[str] = None


@strawberry.type
class UserResponse:
    success: bool
    message: str
    user: Optional[UserNode] = None


@strawberry.input
class CustomerInput:
    displayName: str
    customerType: str
    branchCode: str
    emailAddress: Optional[str] = None
    mobileNumber: Optional[str] = None


@strawberry.type
class CustomerResponse:
    success: bool
    message: str
    customer: Optional[CustomerNode] = None


@strawberry.input
class BranchInput:
    code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contactNumber: Optional[str] = None


@strawberry.type
class BranchResponse:
    success: bool
    message: str
    branch: Optional[BranchNode] = None


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

    @strawberry.field
    async def customer(self) -> Optional[CustomerNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(Customer).filter(Customer.id == int(self.customerId))
            result = await session.execute(stmt)
            customer = result.scalar_one_or_none()
            if not customer:
                return None
            return CustomerNode(
                id=str(customer.id),
                displayName=customer.display_name,
                customerType=customer.customer_type,
                branchCode=customer.branch_code,
                isActive=customer.is_active,
                emailAddress=customer.email_address,
                mobileNumber=customer.mobile_number,
                createdAt=customer.created_at,
            )


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
    outstandingBalance: Optional[Decimal] = None
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
    code: str
    name: str
    type: str  # asset, liability, equity, income, expense
    balance: Decimal
    createdAt: datetime


@strawberry.type
class JournalLineNode:
    id: str
    accountCode: str
    accountName: Optional[str]
    debit: Decimal
    credit: Decimal
    description: Optional[str]


@strawberry.type
class JournalEntryNode:
    id: strawberry.ID
    referenceNo: str
    description: Optional[str]
    timestamp: datetime
    createdBy: Optional[str]
    lines: List[JournalLineNode]


@strawberry.type
class JournalEntriesResponse:
    success: bool
    message: str
    entries: List[JournalEntryNode]
    total: int


@strawberry.type
class GLTransactionNode:
    id: str
    accountId: str
    amount: Decimal
    accountType: str  # debit or credit
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
    totalCollections: Decimal = Decimal("0.00")
    pendingCollections: Decimal = Decimal("0.00")
    overdueCollections: Decimal = Decimal("0.00")
    collectedThisMonth: Decimal = Decimal("0.00")


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
    minLoanAmount: Decimal = Decimal("1000.00")
    maxLoanAmount: Decimal = Decimal("1000000.00")
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class FinancialMetricsNode:
    averageCollectionDays: float = 0.0
    collectionEfficiency: float = 100.0
    totalOutstanding: Decimal = Decimal("0.00")
    totalCollected: Decimal = Decimal("0.00")
    totalNPL: Decimal = Decimal("0.00")
    nplRatio: float = 0.0
    totalLLR: Decimal = Decimal("0.00")
    llrRatio: float = 0.0
    provisionedAmount: Decimal = Decimal("0.00")


@strawberry.type
class FinancialStatementNode:
    revenue: Decimal = Decimal("0.00")
    expenses: Decimal = Decimal("0.00")
    profit: Decimal = Decimal("0.00")
    assets: Decimal = Decimal("0.00")
    liabilities: Decimal = Decimal("0.00")
    equity: Decimal = Decimal("0.00")
    createdAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
@strawberry.type
class BranchNode:
    id: int
    code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contactNumber: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = strawberry.field(default_factory=datetime.now)
    updatedAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class Query:
    @strawberry.field
    async def users(self, skip: int = 0, limit: int = 100) -> List[UserNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(select(User).offset(skip).limit(limit))
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
    async def branches(self) -> List[BranchNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(Branch)
            result = await session.execute(stmt)
            branches = result.scalars().all()
            return [
                BranchNode(
                    id=b.id,
                    code=b.code,
                    name=b.name,
                    address=b.address,
                    city=b.city,
                    contactNumber=b.contact_number,
                    isActive=b.is_active,
                    createdAt=b.created_at,
                    updatedAt=b.updated_at,
                )
                for b in branches
            ]

    @strawberry.field
    async def health(self) -> Health:
        return Health(status="ok", message="Lending MVP GraphQL API is running")

    @strawberry.field
    async def branches(self) -> List[BranchNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(Branch)
            result = await session.execute(stmt)
            branches = result.scalars().all()
            return [
                BranchNode(
                    id=b.id,
                    code=b.code,
                    name=b.name,
                    address=b.address,
                    city=b.city,
                    contactNumber=b.contact_number,
                    isActive=b.is_active,
                    createdAt=b.created_at,
                    updatedAt=b.updated_at,
                )
                for b in branches
            ]

    @strawberry.field
    async def branches(self) -> List[BranchNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(Branch)
            result = await session.execute(stmt)
            branches = result.scalars().all()
            return [
                BranchNode(
                    id=b.id,
                    code=b.code,
                    name=b.name,
                    address=b.address,
                    city=b.city,
                    contactNumber=b.contact_number,
                    isActive=b.is_active,
                    createdAt=b.created_at,
                    updatedAt=b.updated_at,
                )
                for b in branches
            ]
        return Health(status="ok", message="Lending MVP GraphQL API is running")

    @strawberry.field
    async def customers(
        self, skip: int = 0, limit: int = 100, searchTerm: Optional[str] = None
    ) -> CustomerConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            query = select(Customer).offset(skip).limit(limit)
            if searchTerm:
                query = query.where(Customer.display_name.ilike(f"%{searchTerm}%"))

            result = await session.execute(query)
            customers = result.scalars().all()

            customer_count = await session.execute(
                select(func.count()).select_from(Customer)
            )
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
                        createdAt=c.created_at,
                    )
                    for c in customers
                ],
                total=total,
            )

    @strawberry.field
    async def customer(self, id: strawberry.ID) -> Optional[CustomerNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(Customer).where(Customer.id == str(id))
            )
            c = result.scalar_one_or_none()
            if not c:
                return None
            return CustomerNode(
                id=str(c.id),
                displayName=c.display_name,
                customerType=c.customer_type,
                branchCode=c.branch_code,
                isActive=c.is_active,
                firstName=c.first_name,
                lastName=c.last_name,
                emailAddress=c.email_address,
                mobileNumber=c.mobile_number,
                createdAt=c.created_at,
            )

    @strawberry.field
    async def loans(
        self,
        skip: int = 0,
        limit: int = 100,
        customerId: Optional[str] = None,
        searchTerm: Optional[str] = None,
    ) -> LoanConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(LoanApplication)
            if customerId:
                stmt = stmt.where(LoanApplication.customer_id == customerId)
            if searchTerm:
                stmt = stmt.where(
                    LoanApplication.borrower_name.ilike(f"%{searchTerm}%")
                )

            result = await session.execute(stmt.offset(skip).limit(limit))
            loan_list = result.scalars().all()

            loan_count = await session.execute(
                select(func.count()).select_from(LoanApplication)
            )
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
                        outstandingBalance=l.outstanding_balance,
                        createdAt=l.created_at,
                        updatedAt=l.updated_at,
                        disbursedAt=l.disbursed_at,
                    )
                    for l in loan_list
                ],
                total=total,
            )

    @strawberry.field
    async def loan(self, id: strawberry.ID) -> Optional[LoanNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(LoanApplication).where(LoanApplication.id == int(id))
            )
            l = result.scalar_one_or_none()
            if not l:
                return None
            return LoanNode(
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
                disbursedAt=l.disbursed_at,
            )

    @strawberry.field
    async def loanTransactions(
        self, loanId: strawberry.ID
    ) -> List[LoanTransactionNode]:
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
    async def savingsAccounts(
        self,
        skip: int = 0,
        limit: int = 100,
        customerId: Optional[str] = None,
        searchTerm: Optional[str] = None,
    ) -> SavingsAccountConnection:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(SavingsAccount)
            if customerId:
                stmt = stmt.where(SavingsAccount.customer_id == int(customerId))
            if searchTerm:
                stmt = stmt.where(
                    SavingsAccount.account_number.ilike(f"%{searchTerm}%")
                )

            # Get total count before pagination
            count_stmt = select(func.count()).select_from(stmt.subquery())
            total_result = await session.execute(count_stmt)
            total = total_result.scalar() or 0

            result = await session.execute(stmt.offset(skip).limit(limit))
            accounts = result.scalars().all()

            return SavingsAccountConnection(
                accounts=[
                    SavingsAccountNode(
                        id=str(a.id),
                        accountNumber=a.account_number,
                        balance=Decimal(str(a.balance)),
                        customerId=str(a.customer_id),
                        accountType=a.account_type,
                        status=a.status,
                        openedAt=a.opened_at,
                    )
                    for a in accounts
                ],
                total=total,
            )

    @strawberry.field
    async def savingsTransactions(
        self, accountId: strawberry.ID
    ) -> List[SavingsTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(SavingsTransaction).where(
                    SavingsTransaction.account_id == int(accountId)
                )
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
                    createdAt=t.created_at,
                )
                for t in transactions
            ]

    @strawberry.field
    async def customerActivities(self, customerId: str) -> List[CustomerActivityNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            result = await session.execute(
                select(CustomerActivity).where(
                    CustomerActivity.customer_id == customerId
                )
            )
            activities = result.scalars().all()
            return [
                CustomerActivityNode(
                    id=str(a.id),
                    customerId=str(a.customer_id),
                    activityType=a.action,
                    description=a.detail,
                    timestamp=a.created_at,
                    createdBy=a.actor_username or "system",
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
                    createdAt=c.created_at,
                )
                for c in collections
            ]

    @strawberry.field
    async def collectionDue(self) -> List[CollectionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            today = date.today()
            result = await session.execute(
                select(Collection)
                .where(Collection.due_date <= today)
                .order_by(Collection.due_date.asc())
            )
            collections = result.scalars().all()
            return [
                CollectionNode(
                    id=str(c.id),
                    customerId=str(c.customer_id),
                    amount=c.amount,
                    status=c.status,
                    dueDate=c.due_date,
                    createdAt=c.created_at,
                )
                for c in collections
            ]

    @strawberry.field
    async def glAccounts(self) -> List[GLAccountNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = (
                select(
                    GLAccount,
                    func.sum(JournalLine.debit).label("total_debit"),
                    func.sum(JournalLine.credit).label("total_credit"),
                )
                .outerjoin(JournalLine, GLAccount.code == JournalLine.account_code)
                .group_by(GLAccount.id)
            )
            result = await session.execute(stmt)
            rows = result.all()
            nodes = []
            for row in rows:
                acc = row[0]
                total_debit = row[1] or Decimal("0.00")
                total_credit = row[2] or Decimal("0.00")
                balance = (
                    (total_debit - total_credit)
                    if acc.type.lower() in ["asset", "expense"]
                    else (total_credit - total_debit)
                )
                nodes.append(
                    GLAccountNode(
                        id=str(acc.id),
                        code=acc.code,
                        name=acc.name,
                        type=acc.type,
                        balance=balance,
                        createdAt=acc.created_at,
                    )
                )
            return nodes

    @strawberry.field
    async def collectionsDashboard(self) -> CollectionsDashboardNode:
        session_factory = get_async_session_local()
        today = date.today()
        first_day_of_month = today.replace(day=1)
        async with session_factory() as session:
            # 1. Dashboard Metrics
            total_collections = (
                await session.execute(
                    select(
                        func.sum(
                            AmortizationSchedule.principal_paid
                            + AmortizationSchedule.interest_paid
                        )
                    )
                )
            ).scalar() or Decimal("0.00")
            pending_collections = (
                await session.execute(
                    select(
                        func.sum(
                            AmortizationSchedule.principal_due
                            + AmortizationSchedule.interest_due
                            - AmortizationSchedule.principal_paid
                            - AmortizationSchedule.interest_paid
                        )
                    ).where(AmortizationSchedule.due_date >= today)
                )
            ).scalar() or Decimal("0.00")
            overdue_collections = (
                await session.execute(
                    select(
                        func.sum(
                            AmortizationSchedule.principal_due
                            + AmortizationSchedule.interest_due
                            - AmortizationSchedule.principal_paid
                            - AmortizationSchedule.interest_paid
                        )
                    ).where(AmortizationSchedule.due_date < today)
                )
            ).scalar() or Decimal("0.00")
            collected_this_month = (
                await session.execute(
                    select(
                        func.sum(
                            AmortizationSchedule.principal_paid
                            + AmortizationSchedule.interest_paid
                        )
                    ).where(AmortizationSchedule.due_date >= first_day_of_month)
                )
            ).scalar() or Decimal("0.00")

            # 2. Aging Buckets (Simplified logic based on overdue installments)
            # Fetch all unpaid installments to bucketize
            stmt = select(AmortizationSchedule).where(
                AmortizationSchedule.status != "paid"
            )
            unpaid = (await session.execute(stmt)).scalars().all()

            buckets = {
                "Current": {"count": 0, "amount": Decimal("0.00")},
                "1-30 DPD": {"count": 0, "amount": Decimal("0.00")},
                "31-60 DPD": {"count": 0, "amount": Decimal("0.00")},
                "61-90 DPD": {"count": 0, "amount": Decimal("0.00")},
                "90+ DPD": {"count": 0, "amount": Decimal("0.00")},
            }

            loan_ids_counted = set()
            total_loans_count = (
                await session.execute(select(func.count(LoanApplication.id)))
            ).scalar() or 0
            total_outstanding_stmt = select(
                func.sum(
                    AmortizationSchedule.principal_due
                    + AmortizationSchedule.interest_due
                    - AmortizationSchedule.principal_paid
                    - AmortizationSchedule.interest_paid
                )
            )
            total_outstanding = (
                await session.execute(total_outstanding_stmt)
            ).scalar() or Decimal("0.00")

            for item in unpaid:
                days_past_due = (today - item.due_date).days
                amount_due = (
                    item.principal_due
                    + item.interest_due
                    - item.principal_paid
                    - item.interest_paid
                )

                label = "Current"
                if days_past_due > 90:
                    label = "90+ DPD"
                elif days_past_due > 60:
                    label = "61-90 DPD"
                elif days_past_due > 30:
                    label = "31-60 DPD"
                elif days_past_due > 0:
                    label = "1-30 DPD"

                buckets[label]["amount"] += amount_due
                buckets[label]["count"] += (
                    1  # In a real system this would be per loan, but using per installment for simplicity
                )

            bucket_nodes = [
                CollectionBucket(
                    label=k, loanCount=v["count"], totalOutstanding=v["amount"]
                )
                for k, v in buckets.items()
            ]

            return CollectionsDashboardNode(
                totalLoans=total_loans_count,
                totalOutstanding=total_outstanding,
                buckets=bucket_nodes,
                totalCollections=total_collections,
                pendingCollections=pending_collections,
                overdueCollections=overdue_collections,
                collectedThisMonth=collected_this_month,
            )

    @strawberry.field
    async def auditLogs(self, limit: int = 50, offset: int = 0) -> List[AuditLogNode]:
        return []

    @strawberry.field
    async def loanAmortization(
        self, loanId: strawberry.ID
    ) -> Optional[LoanAmortizationNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            l = (
                await session.execute(
                    select(LoanApplication).where(LoanApplication.id == int(loanId))
                )
            ).scalar_one_or_none()
            if not l:
                return None
            sched_items = (
                (
                    await session.execute(
                        select(AmortizationSchedule)
                        .where(AmortizationSchedule.loan_id == l.id)
                        .order_by(AmortizationSchedule.installment_number)
                    )
                )
                .scalars()
                .all()
            )
            rows, balance = [], l.principal
            for item in sched_items:
                balance -= item.principal_paid
                rows.append(
                    AmortizationScheduleRow(
                        month=item.installment_number,
                        principalPayment=item.principal_due,
                        interestPayment=item.interest_due,
                        totalPayment=item.principal_due + item.interest_due,
                        outstandingBalance=balance,
                    )
                )
            return LoanAmortizationNode(
                id=str(l.id),
                loanId=str(l.id),
                principal=l.principal,
                interestRate=l.approved_rate or Decimal("12.00"),
                termMonths=l.term_months,
                amortizationSchedule=rows,
            )

    @strawberry.field
    async def loanProducts(self) -> List[LoanProductNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            prods = (await session.execute(select(PGLoanProduct))).scalars().all()
            return [
                LoanProductNode(
                    id=str(p.id),
                    name=p.name,
                    productCode=p.product_code,
                    description=p.description,
                    interestRate=p.interest_rate,
                    termMonths=12,
                    createdAt=p.created_at,
                )
                for p in prods
            ]

    @strawberry.field
    async def parMetrics(self) -> FinancialMetricsNode:
        return FinancialMetricsNode()

    @strawberry.field
    async def nplMetrics(self) -> FinancialMetricsNode:
        return FinancialMetricsNode()

    @strawberry.field
    async def llrMetrics(self) -> FinancialMetricsNode:
        return FinancialMetricsNode()

    @strawberry.field
    async def incomeStatement(self, year: int, month: int) -> FinancialStatementNode:
        return FinancialStatementNode()

    @strawberry.field
    async def balanceSheet(self, year: int, month: int) -> FinancialStatementNode:
        return FinancialStatementNode()

    @strawberry.field
    async def unresolvedAlerts(self) -> List[Health]:
        return []  # Placeholder

    @strawberry.field
    async def complianceReports(self) -> List[Health]:
        return []  # Placeholder

    @strawberry.field
    async def journalEntries(
        self, skip: int = 0, limit: int = 50, referenceNo: Optional[str] = None
    ) -> JournalEntriesResponse:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            query = select(JournalEntry)
            if referenceNo:
                query = query.filter(JournalEntry.reference_no == referenceNo)

            count_result = await session.execute(query)
            all_entries = count_result.scalars().all()
            total = len(all_entries)

            result = await session.execute(
                query.order_by(JournalEntry.timestamp.desc()).offset(skip).limit(limit)
            )
            from sqlalchemy.orm import joinedload

            entries = []
            for entry in result.scalars().all():
                lines_result = await session.execute(
                    select(JournalLine)
                    .options(joinedload(JournalLine.account))
                    .filter(JournalLine.entry_id == entry.id)
                )
                lines = [
                    JournalLineNode(
                        id=str(l.id),
                        accountCode=l.account_code,
                        accountName=l.account.name if l.account else None,
                        debit=l.debit,
                        credit=l.credit,
                        description=l.description,
                    )
                    for l in lines_result.scalars().all()
                ]
                entries.append(
                    JournalEntryNode(
                        id=strawberry.ID(str(entry.id)),
                        referenceNo=entry.reference_no,
                        description=entry.description,
                        timestamp=entry.timestamp,
                        createdBy=entry.created_by,
                        lines=lines,
                    )
                )

            return JournalEntriesResponse(
                success=True, message="OK", entries=entries, total=total
            )

    @strawberry.field
    async def journalEntryByReference(
        self, reference: str
    ) -> Optional[JournalEntryNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            totals_stmt = (
                select(
                    JournalLine.entry_id,
                    func.sum(JournalLine.debit).label("total_debit"),
                    func.sum(JournalLine.credit).label("total_credit"),
                )
                .group_by(JournalLine.entry_id)
                .subquery()
            )
            stmt = (
                select(
                    JournalEntry, totals_stmt.c.total_debit, totals_stmt.c.total_credit
                )
                .outerjoin(totals_stmt, JournalEntry.id == totals_stmt.c.entry_id)
                .where(JournalEntry.reference_no == reference)
            )
            r = (await session.execute(stmt)).first()
            if not r:
                return None
            return JournalEntryNode(
                id=str(r[0].id),
                date=r[0].timestamp,
                description=r[0].description,
                reference=r[0].reference_no,
                debit=r[1] or Decimal("0.00"),
                credit=r[2] or Decimal("0.00"),
                createdAt=r[0].timestamp,
            )

    @strawberry.field
    async def glAccountTransactions(
        self, accountId: strawberry.ID
    ) -> List[GLTransactionNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            acc = (
                await session.execute(
                    select(GLAccount).where(GLAccount.id == int(accountId))
                )
            ).scalar_one_or_none()
            if not acc:
                return []
            rows = (
                await session.execute(
                    select(JournalLine, JournalEntry)
                    .join(JournalEntry)
                    .where(JournalLine.account_code == acc.code)
                    .order_by(JournalEntry.timestamp.desc())
                )
            ).all()
            return [
                GLTransactionNode(
                    id=str(l.id),
                    accountId=str(acc.id),
                    amount=l.debit if l.debit > 0 else l.credit,
                    type="debit" if l.debit > 0 else "credit",
                    reference=e.reference_no,
                    createdAt=e.timestamp,
                )
                for l, e in rows
            ]

    @strawberry.field
    async def dashboardStats(self) -> DashboardStats:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            customer_count = (
                await session.execute(select(func.count(Customer.id)))
            ).scalar() or 0
            loan_count = (
                await session.execute(select(func.count(LoanApplication.id)))
            ).scalar() or 0
            return DashboardStats(customersTotal=customer_count, loansTotal=loan_count)


@strawberry.type
class MutationResponse:
    success: bool
    message: str


@strawberry.type
class BranchNode:
    id: int
    code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contactNumber: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = strawberry.field(default_factory=datetime.now)
    updatedAt: datetime = strawberry.field(default_factory=datetime.now)


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_dummy(self) -> MutationResponse:
        return MutationResponse(success=True, message="Placeholder")

    @strawberry.mutation
    async def create_branch(self, info: Info, input: BranchInput) -> BranchResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin"):
            return BranchResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Check existing
                existing = await session.execute(
                    select(Branch).where(Branch.code == input.code)
                )
                if existing.scalar_one_or_none():
                    return BranchResponse(
                        success=False, message="Branch code already exists"
                    )

                new_branch = Branch(
                    code=input.code,
                    name=input.name,
                    address=input.address,
                    city=input.city,
                    contact_number=input.contactNumber,
                    is_active=True,
                )
                session.add(new_branch)
                await session.commit()
                await session.refresh(new_branch)

                return BranchResponse(
                    success=True,
                    message="Branch created successfully",
                    branch=BranchNode(
                        id=new_branch.id,
                        code=new_branch.code,
                        name=new_branch.name,
                        address=new_branch.address,
                        city=new_branch.city,
                        contactNumber=new_branch.contact_number,
                        isActive=new_branch.is_active,
                        createdAt=new_branch.created_at,
                        updatedAt=new_branch.updated_at,
                    ),
                )
            except Exception as e:
                await session.rollback()
                return BranchResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def update_branch(
        self, info: Info, branchId: strawberry.ID, input: BranchInput
    ) -> BranchResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin"):
            return BranchResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                result = await session.execute(
                    select(Branch).where(Branch.id == int(str(branchId)))
                )
                b = result.scalar_one_or_none()
                if not b:
                    return BranchResponse(success=False, message="Branch not found")

                b.name = input.name
                b.address = input.address
                b.city = input.city
                b.contact_number = input.contactNumber

                await session.commit()
                return BranchResponse(
                    success=True, message="Branch updated successfully"
                )
            except Exception as e:
                await session.rollback()
                return BranchResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def delete_branch(
        self, info: Info, branchId: strawberry.ID
    ) -> MutationResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin"):
            return MutationResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                result = await session.execute(
                    select(Branch).where(Branch.id == int(str(branchId)))
                )
                b = result.scalar_one_or_none()
                if not b:
                    return MutationResponse(success=False, message="Branch not found")

                await session.delete(b)
                await session.commit()
                return MutationResponse(
                    success=True, message="Branch deleted successfully"
                )
            except Exception as e:
                await session.rollback()
                return MutationResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def create_user(self, info: Info, input: UserCreateInput) -> UserResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            return UserResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Check existing
                existing = await session.execute(
                    select(User).where(
                        (User.username == input.username) | (User.email == input.email)
                    )
                )
                if existing.scalar_one_or_none():
                    return UserResponse(
                        success=False, message="Username or Email already exists"
                    )

                new_user = User(
                    username=input.username,
                    email=input.email,
                    full_name=input.fullName,
                    hashed_password=get_password_hash(input.password),
                    role=input.role or "customer",
                    is_active=True,
                    is_superuser=(input.role == "admin"),
                    branch_id=input.branchId,
                    branch_code=input.branchCode,
                )
                session.add(new_user)
                await session.flush()  # Get ID

                if input.branchId or input.branchCode:
                    assignment = UserBranchAssignment(
                        user_id=str(new_user.uuid if new_user.uuid else new_user.id),
                        branch_id=input.branchId,
                        branch_code=input.branchCode,
                    )
                    session.add(assignment)

                await session.commit()
                return UserResponse(
                    success=True,
                    message="User created successfully",
                    user=UserNode(
                        id=str(new_user.uuid if new_user.uuid else new_user.id),
                        email=new_user.email,
                        username=new_user.username,
                        fullName=new_user.full_name,
                        isActive=new_user.is_active,
                        role=new_user.role,
                    ),
                )
            except Exception as e:
                await session.rollback()
                return UserResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def update_user(
        self, info: Info, id: strawberry.ID, input: UserUpdateInput
    ) -> UserResponse:
        current_user = info.context.get("current_user")
        # Admin can update anyone, others only themselves (except branch managers who can update branch users?)
        # For simplicity, keeping it to admin/branch_manager for now as per user request
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            if str(current_user.uuid if current_user.uuid else current_user.id) != str(
                id
            ):
                return UserResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Find user by UUID or ID
                from sqlalchemy import or_

                result = await session.execute(
                    select(User).where(
                        or_(
                            User.uuid == str(id),
                            User.id == int(id) if str(id).isdigit() else False,
                        )
                    )
                )
                u = result.scalar_one_or_none()
                if not u:
                    return UserResponse(success=False, message="User not found")

                if input.username:
                    u.username = input.username
                if input.email:
                    u.email = input.email
                if input.fullName:
                    u.full_name = input.fullName
                if input.isActive is not None:
                    u.is_active = input.isActive
                if input.role:
                    # Only admin can change roles
                    if current_user.role == "admin":
                        u.role = input.role
                        u.is_superuser = input.role == "admin"

                if input.password:
                    u.hashed_password = get_password_hash(input.password)

                if input.branchId is not None:
                    u.branch_id = input.branchId
                if input.branchCode is not None:
                    u.branch_code = input.branchCode

                if input.branchId is not None or input.branchCode is not None:
                    # Update assignment
                    res_ba = await session.execute(
                        select(UserBranchAssignment).where(
                            UserBranchAssignment.user_id == str(id)
                        )
                    )
                    ba = res_ba.scalar_one_or_none()
                    if ba:
                        if input.branchId is not None:
                            ba.branch_id = input.branchId
                        if input.branchCode is not None:
                            ba.branch_code = input.branchCode
                    else:
                        session.add(
                            UserBranchAssignment(
                                user_id=str(id),
                                branch_id=input.branchId,
                                branch_code=input.branchCode,
                            )
                        )

                await session.commit()
                return UserResponse(success=True, message="User updated successfully")
            except Exception as e:
                await session.rollback()
                return UserResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def delete_user(self, info: Info, id: strawberry.ID) -> MutationResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            return MutationResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                from sqlalchemy import or_

                result = await session.execute(
                    select(User).where(
                        or_(
                            User.uuid == str(id),
                            User.id == int(id) if str(id).isdigit() else False,
                        )
                    )
                )
                u = result.scalar_one_or_none()
                if not u:
                    return MutationResponse(success=False, message="User not found")

                await session.delete(u)
                await session.commit()
                return MutationResponse(
                    success=True, message="User deleted successfully"
                )
            except Exception as e:
                await session.rollback()
                return MutationResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def create_customer(
        self, info: Info, input: CustomerInput
    ) -> CustomerResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            return CustomerResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Lookup branch_id from code
                branch_stmt = select(Branch).where(Branch.code == input.branchCode)
                branch_res = await session.execute(branch_stmt)
                branch = branch_res.scalar_one_or_none()
                branch_id = branch.id if branch else None

                new_customer = Customer(
                    display_name=input.displayName,
                    customer_type=input.customerType,
                    branch_code=input.branchCode,
                    branch_id=branch_id,
                    email_address=input.emailAddress,
                    mobile_number=input.mobileNumber,
                    is_active=True,
                )
                session.add(new_customer)
                await session.commit()
                await session.refresh(new_customer)

                return CustomerResponse(
                    success=True,
                    message="Customer created successfully",
                    customer=CustomerNode(
                        id=str(new_customer.id),
                        displayName=new_customer.display_name,
                        customerType=new_customer.customer_type,
                        branchCode=new_customer.branch_code,
                        isActive=new_customer.is_active,
                        emailAddress=new_customer.email_address,
                        mobileNumber=new_customer.mobile_number,
                        createdAt=new_customer.created_at,
                    ),
                )
            except Exception as e:
                await session.rollback()
                return CustomerResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def update_customer(
        self, info: Info, id: strawberry.ID, input: CustomerInput
    ) -> CustomerResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            return CustomerResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Cast id to int for BigInteger comparison
                cust_id = int(str(id))
                result = await session.execute(
                    select(Customer).where(Customer.id == cust_id)
                )
                c = result.scalar_one_or_none()
                if not c:
                    return CustomerResponse(success=False, message="Customer not found")

                # Lookup branch_id if code changed
                if input.branchCode != c.branch_code:
                    branch_stmt = select(Branch).where(Branch.code == input.branchCode)
                    branch_res = await session.execute(branch_stmt)
                    branch = branch_res.scalar_one_or_none()
                    if branch:
                        c.branch_id = branch.id

                c.display_name = input.displayName
                c.customer_type = input.customerType
                c.branch_code = input.branchCode
                c.email_address = input.emailAddress
                c.mobile_number = input.mobileNumber

                await session.commit()
                return CustomerResponse(
                    success=True, message="Customer updated successfully"
                )
            except Exception as e:
                await session.rollback()
                return CustomerResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def delete_customer(self, info: Info, id: strawberry.ID) -> MutationResponse:
        current_user = info.context.get("current_user")
        if not current_user or current_user.role not in ("admin", "branch_manager"):
            return MutationResponse(success=False, message="Not authorized")

        session_factory = get_async_session_local()
        async with session_factory() as session:
            try:
                # Cast id to int for BigInteger comparison
                cust_id = int(str(id))
                result = await session.execute(
                    select(Customer).where(Customer.id == cust_id)
                )
                c = result.scalar_one_or_none()
                if not c:
                    return MutationResponse(success=False, message="Customer not found")

                await session.delete(c)
                await session.commit()
                return MutationResponse(
                    success=True, message="Customer deleted successfully"
                )
            except Exception as e:
                await session.rollback()
                return MutationResponse(success=False, message=f"Error: {str(e)}")

    @strawberry.mutation
    async def submit_loan(self, loanId: strawberry.ID) -> MutationResponse:
        return MutationResponse(success=True, message="Loan submitted for review")

    @strawberry.mutation
    async def approve_loan(
        self,
        id: strawberry.ID,
        approvedPrincipal: Optional[Decimal] = None,
        approvedRate: Optional[Decimal] = None,
    ) -> MutationResponse:
        return MutationResponse(success=True, message="Loan approved")

    @strawberry.field
    async def branches(self) -> List[BranchNode]:
        session_factory = get_async_session_local()
        async with session_factory() as session:
            stmt = select(Branch)
            result = await session.execute(stmt)
            branches = result.scalars().all()
            return [
                BranchNode(
                    id=b.id,
                    code=b.code,
                    name=b.name,
                    address=b.address,
                    city=b.city,
                    contactNumber=b.contact_number,
                    isActive=b.is_active,
                    createdAt=b.created_at,
                    updatedAt=b.updated_at,
                )
                for b in branches
            ]

    @strawberry.mutation
    async def createGLAccount(
        self, info: Info, input: GLAccountCreateInput
    ) -> GLAccountResponse:
        from .chart_of_accounts import ChartOfAccountsMutation

        return await ChartOfAccountsMutation().create_gl_account(info, input)

    @strawberry.mutation
    async def createManualJournalEntry(
        self, info: Info, input: JournalEntryCreateInput
    ) -> JournalEntryResponse:
        from .chart_of_accounts import ChartOfAccountsMutation

        return await ChartOfAccountsMutation().create_manual_journal_entry(info, input)


schema = strawberry.Schema(query=Query, mutation=Mutation)
