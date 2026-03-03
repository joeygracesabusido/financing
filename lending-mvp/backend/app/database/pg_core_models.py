"""
Core PostgreSQL models for Phase 2 migration.
Replaces MongoDB documents with relational tables for:
- users
- customers
- savings accounts
- transactions
- ledger entries
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import DeclarativeBase, relationship

from .pg_loan_models import PGLoanProduct
from .pg_models import Branch
from .pg_accounting_models import GLAccount, JournalEntry


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Users - Replaces MongoDB users collection
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=lambda: str(uuid4()), unique=True, index=True)
    
    email = Column(String(200), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    full_name = Column(String(200), nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False)  # "admin", "manager", "staff", "teller"
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    branch = relationship("Branch", backref="users")
    branch_code = Column(String(20), nullable=True, index=True)  # denormalized for performance
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_username", "username"),
        Index("ix_users_branch", "branch_id"),
    )


# ---------------------------------------------------------------------------
# Customers - Replaces MongoDB customers collection
# ---------------------------------------------------------------------------
class Customer(Base):
    __tablename__ = "customers"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    customer_type = Column(String(50), nullable=False)  # "individual", "corporate"
    
    # Individual fields
    last_name = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    display_name = Column(String(300), nullable=False, index=True)
    
    # Identification
    tin_no = Column(String(50), nullable=True)
    sss_no = Column(String(50), nullable=True)
    
    # Personal info
    birth_date = Column(Date, nullable=True)
    birth_place = Column(String(200), nullable=True)
    
    # Contact
    mobile_number = Column(String(50), nullable=True)
    email_address = Column(String(200), nullable=True)
    
    # Address
    permanent_address = Column(Text, nullable=True)
    
    # Employment (for individuals)
    employer_name_address = Column(Text, nullable=True)
    job_title = Column(String(100), nullable=True)
    salary_range = Column(String(50), nullable=True)
    
    # Company info (for corporate)
    company_name = Column(String(200), nullable=True)
    company_address = Column(Text, nullable=True)
    
    # Branch association
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="customers")
    branch_code = Column(String(20), nullable=False, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    savings_accounts = relationship("SavingsAccount", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_customers_display_name", "display_name"),
        Index("ix_customers_branch", "branch_id"),
        Index("ix_customers_mobile", "mobile_number"),
    )


# ---------------------------------------------------------------------------
# Savings Accounts - Replaces MongoDB savings collection
# ---------------------------------------------------------------------------
class SavingsAccount(Base):
    __tablename__ = "savings_accounts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    account_number = Column(String(50), nullable=False, unique=True, index=True)
    display_name = Column(String(300), nullable=False)
    
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="savings_accounts")
    
    # Account details
    account_type = Column(String(50), nullable=False)  # "regular", "joint", "minor"
    primary_owner_id = Column(BigInteger, nullable=False)
    secondary_owner_id = Column(BigInteger, nullable=True)
    
    # Financials
    current_balance = Column(Numeric(14, 2), nullable=False, default=0.0)
    minimum_balance = Column(Numeric(14, 2), nullable=False, default=1000.0)
    
    # Interest
    interest_rate = Column(Numeric(5, 4), nullable=False, default=0.5)  # 0.5% per month typical
    last_interest_date = Column(Date, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), nullable=False, default="active")  # "active", "dormant", "closed"
    
    # Branch
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="savings_accounts")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    transactions = relationship("SavingsTransaction", back_populates="account", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_savings_account_number", "account_number"),
        Index("ix_savings_customer", "customer_id"),
        Index("ix_savings_branch", "branch_id"),
    )


# ---------------------------------------------------------------------------
# Savings Transactions - For savings account transactions
# ---------------------------------------------------------------------------
class SavingsTransaction(Base):
    __tablename__ = "savings_transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    transaction_id = Column(String(100), nullable=False, unique=True, index=True)
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    account = relationship("SavingsAccount", back_populates="transactions")
    
    # Transaction details
    transaction_type = Column(String(50), nullable=False)  # "deposit", "withdrawal", "transfer"
    amount = Column(Numeric(14, 2), nullable=False)
    balance_after = Column(Numeric(14, 2), nullable=True)
    
    description = Column(Text, nullable=True)
    reference = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(50), nullable=False, default="completed")
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # User
    processed_by = Column(String(64), nullable=True)
    processed_by_username = Column(String(100), nullable=True)
    
    # Branch
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="savings_transactions")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_savings_tx_transaction_id", "transaction_id"),
        Index("ix_savings_tx_account", "account_id"),
        Index("ix_savings_tx_branch", "branch_id"),
        Index("ix_savings_tx_timestamp", "timestamp"),
    )


# ---------------------------------------------------------------------------
# Loans - Replaces MongoDB loans collection
# ---------------------------------------------------------------------------
class Loan(Base):
    __tablename__ = "loans"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    loan_id = Column(String(50), nullable=False, unique=True, index=True)
    
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="loans")
    
    # Product reference
    product_id = Column(BigInteger, ForeignKey("loan_products.id"), nullable=False)
    product = relationship("PGLoanProduct", backref="loans")
    
    # Financials
    principal = Column(Numeric(14, 2), nullable=False)
    interest_rate = Column(Numeric(10, 4), nullable=False)
    term_months = Column(Integer, nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default="pending")
    
    # Disbursement
    disbursement_date = Column(Date, nullable=True)
    disbursement_amount = Column(Numeric(14, 2), nullable=True)
    
    # Branch
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="loans")
    branch_code = Column(String(20), nullable=False, index=True)
    
    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    # Relationships
    transactions = relationship("LoanTransaction", back_populates="loan", cascade="all, delete-orphan")
    schedules = relationship("AmortizationSchedule", back_populates="loan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_loans_loan_id", "loan_id"),
        Index("ix_loans_customer", "customer_id"),
        Index("ix_loans_branch", "branch_id"),
        Index("ix_loans_status", "status"),
    )


# ---------------------------------------------------------------------------
# Loan Transactions
# ---------------------------------------------------------------------------
class LoanTransaction(Base):
    __tablename__ = "loan_transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    loan_id = Column(BigInteger, ForeignKey("loans.id"), nullable=False)
    loan = relationship("Loan", back_populates="transactions")
    
    transaction_id = Column(String(100), nullable=False, unique=True, index=True)
    transaction_type = Column(String(50), nullable=False)  # "disbursement", "repayment", "fee"
    amount = Column(Numeric(14, 2), nullable=False)
    
    receipt_number = Column(String(100), nullable=True, unique=True)
    description = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    processed_by = Column(String(64), nullable=True)
    
    __table_args__ = (
        Index("ix_loan_tx_transaction_id", "transaction_id"),
        Index("ix_loan_tx_loan", "loan_id"),
        Index("ix_loan_tx_timestamp", "timestamp"),
    )


# ---------------------------------------------------------------------------
# Amortization Schedule
# ---------------------------------------------------------------------------
class AmortizationSchedule(Base):
    __tablename__ = "amortization_schedules"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loans.id"), nullable=False, index=True)
    loan = relationship("Loan", back_populates="schedules")
    
    installment_number = Column(BigInteger, nullable=False)
    due_date = Column(Date, nullable=False)
    
    principal_due = Column(Numeric(14, 2), nullable=False)
    interest_due = Column(Numeric(14, 2), nullable=False)
    penalty_due = Column(Numeric(14, 2), nullable=False, default=0)
    
    principal_paid = Column(Numeric(14, 2), nullable=False, default=0)
    interest_paid = Column(Numeric(14, 2), nullable=False, default=0)
    penalty_paid = Column(Numeric(14, 2), nullable=False, default=0)
    
    payment_date = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String(50), nullable=False, default="pending")
    
    __table_args__ = (
        Index("ix_sched_loan_installment", "loan_id", "installment_number"),
    )


# ---------------------------------------------------------------------------
# Transactions - General transactions (can reference savings or loans)
# ---------------------------------------------------------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    transaction_id = Column(String(100), nullable=False, unique=True, index=True)
    transaction_type = Column(String(50), nullable=False)
    
    # Account reference (can be savings or loan)
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=True)
    account = relationship("SavingsAccount", back_populates="transactions")
    
    # For loan transactions, use loan_transaction instead
    loan_transaction_id = Column(BigInteger, ForeignKey("loan_transactions.id"), nullable=True)
    
    amount = Column(Numeric(14, 2), nullable=False)
    balance_after = Column(Numeric(14, 2), nullable=True)
    
    description = Column(Text, nullable=True)
    reference = Column(String(100), nullable=True)
    
    status = Column(String(50), nullable=False, default="completed")
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    processed_by = Column(String(64), nullable=True)
    processed_by_username = Column(String(100), nullable=True)
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="transactions")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_transactions_transaction_id", "transaction_id"),
        Index("ix_transactions_account", "account_id"),
        Index("ix_transactions_branch", "branch_id"),
        Index("ix_transactions_timestamp", "timestamp"),
    )


# ---------------------------------------------------------------------------
# Ledger Entries
# ---------------------------------------------------------------------------
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    transaction_id = Column(String(100), nullable=False, index=True)
    journal_entry_id = Column(BigInteger, ForeignKey("journal_entries.id"), nullable=True)
    journal_entry = relationship("JournalEntry", backref="ledger_entries")
    
    account_code = Column(String(50), ForeignKey("gl_accounts.code"), nullable=False, index=True)
    account = relationship("GLAccount", backref="ledger_entries")
    
    amount = Column(Numeric(14, 2), nullable=False)
    entry_type = Column(String(10), nullable=False)  # "debit", "credit"
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    reference = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="ledger_entries")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_ledger_transaction", "transaction_id"),
        Index("ix_ledger_account", "account_code"),
        Index("ix_ledger_branch", "branch_id"),
    )


# ---------------------------------------------------------------------------
# Standing Orders
# ---------------------------------------------------------------------------
class StandingOrder(Base):
    __tablename__ = "standing_orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    order_id = Column(String(100), nullable=False, unique=True, index=True)
    
    source_account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    source_account = relationship("SavingsAccount", foreign_keys=[source_account_id])
    
    destination_account_number = Column(String(50), nullable=True)
    destination_account_name = Column(String(200), nullable=True)
    destination_bank_code = Column(String(20), nullable=True)
    
    amount = Column(Numeric(14, 2), nullable=False)
    
    frequency = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="standing_orders")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_by = Column(String(64), nullable=True)
    created_by_username = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    __table_args__ = (
        Index("ix_standing_orders_order_id", "order_id"),
        Index("ix_standing_orders_source", "source_account_id"),
        Index("ix_standing_orders_branch", "branch_id"),
    )


# ---------------------------------------------------------------------------
# Interest Ledger
# ---------------------------------------------------------------------------
class InterestLedger(Base):
    __tablename__ = "interest_ledger"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    account = relationship("SavingsAccount", backref="interest_ledger")
    
    amount = Column(Numeric(14, 2), nullable=False)
    interest_rate = Column(Numeric(5, 4), nullable=False)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", backref="interest_ledger")
    branch_code = Column(String(20), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)