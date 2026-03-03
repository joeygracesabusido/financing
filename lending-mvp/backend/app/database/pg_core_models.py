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
from sqlalchemy.orm import relationship

from .base import Base
from .pg_loan_models import PGLoanProduct
# Import Branch and GLAccount directly to avoid circular dependencies
# They are defined later in the file


def _now() -> datetime:
    return datetime.now(timezone.utc)


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
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="savings_accounts")
    
    account_type = Column(String(50), nullable=False)  # "regular", "fixed", "salary"
    
    balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    status = Column(String(20), default="active", nullable=False)
    
    interest_rate = Column(Numeric(5, 2), default=0.00)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    transactions = relationship("SavingsTransaction", back_populates="account", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_savings_accounts_account_number", "account_number"),
        Index("ix_savings_accounts_customer", "customer_id"),
    )


# ---------------------------------------------------------------------------
# Savings Transactions - Replaces MongoDB savings transactions collection
# ---------------------------------------------------------------------------
class SavingsTransaction(Base):
    __tablename__ = "savings_transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    account = relationship("SavingsAccount", back_populates="transactions")
    
    transaction_type = Column(String(20), nullable=False)  # "deposit", "withdrawal"
    amount = Column(Numeric(15, 2), nullable=False)
    
    balance_before = Column(Numeric(15, 2), nullable=False)
    balance_after = Column(Numeric(15, 2), nullable=False)
    
    reference = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_savings_transactions_account", "account_id"),
    )


# ---------------------------------------------------------------------------
# Loans - Replaces MongoDB loans collection
# ---------------------------------------------------------------------------
class Loan(Base):
    __tablename__ = "loans"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    loan_number = Column(String(50), nullable=False, unique=True, index=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="loans")
    
    loan_product_id = Column(BigInteger, ForeignKey("loan_products.id"), nullable=False)
    
    amount = Column(Numeric(15, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    term_months = Column(Integer, nullable=False)
    
    status = Column(String(20), default="pending", nullable=False)
    
    disbursement_date = Column(Date, nullable=True)
    maturity_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    # transactions = relationship("LoanTransaction", back_populates="loan", cascade="all, delete-orphan")
    # amortization_schedule = relationship("AmortizationSchedule", uselist=False, back_populates="loan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_loans_loan_number", "loan_number"),
        Index("ix_loans_customer", "customer_id"),
        Index("ix_loans_status", "status"),
    )


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Transactions - General ledger transactions
# ---------------------------------------------------------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    transaction_date = Column(Date, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    
    # Reference to related entities
    loan_id = Column(BigInteger, ForeignKey("loans.id"), nullable=True)
    savings_account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=True)
    
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_transactions_date", "transaction_date"),
        Index("ix_transactions_loan", "loan_id"),
        Index("ix_transactions_savings", "savings_account_id"),
    )


# ---------------------------------------------------------------------------
# Ledger Entries - General ledger entries
# ---------------------------------------------------------------------------
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    transaction_id = Column(BigInteger, ForeignKey("transactions.id"), nullable=False)
    transaction = relationship("Transaction", backref="ledger_entries")
    
    account_id = Column(BigInteger, ForeignKey("gl_accounts.id"), nullable=False)
    gl_account = relationship("GLAccount", backref="ledger_entries")
    
    debit_amount = Column(Numeric(15, 2), default=0.00)
    credit_amount = Column(Numeric(15, 2), default=0.00)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Standing Orders - Recurring payments
# ---------------------------------------------------------------------------
class StandingOrder(Base):
    __tablename__ = "standing_orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    account = relationship("SavingsAccount", backref="standing_orders")
    
    recipient_account = Column(String(50), nullable=False)
    recipient_name = Column(String(200), nullable=False)
    
    amount = Column(Numeric(15, 2), nullable=False)
    frequency = Column(String(20), nullable=False)  # "daily", "weekly", "monthly"
    
    next_execution_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )


# ---------------------------------------------------------------------------
# Interest Ledger - Tracks interest calculations
# ---------------------------------------------------------------------------
class InterestLedger(Base):
    __tablename__ = "interest_ledger"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    account_id = Column(BigInteger, ForeignKey("savings_accounts.id"), nullable=False)
    account = relationship("SavingsAccount", backref="interest_ledger")
    
    interest_rate = Column(Numeric(5, 2), nullable=False)
    principal_amount = Column(Numeric(15, 2), nullable=False)
    interest_amount = Column(Numeric(15, 2), nullable=False)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    posted_date = Column(DateTime(timezone=True), server_default=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


