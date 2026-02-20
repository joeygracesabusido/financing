from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Numeric,
    String,
    Text,
    ForeignKey,
    Index,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .pg_models import Base

# ---------------------------------------------------------------------------
# Loan Products
# ---------------------------------------------------------------------------
class PGLoanProduct(Base):
    __tablename__ = "loan_products"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_code = Column(String(50), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    amortization_type = Column(String(50), nullable=False) # "flat_rate" | "declining_balance" | "balloon_payment" | "interest_only"
    repayment_frequency = Column(String(50), nullable=False) # "daily" | "weekly" | "bi_weekly" | "monthly" | "quarterly" | "bullet"

    interest_rate = Column(Numeric(10, 4), nullable=False) # Percentage (e.g., 5.0 for 5%)
    penalty_rate = Column(Numeric(10, 4), nullable=False, default=0.0) # Percentage
    grace_period_months = Column(BigInteger, nullable=False, default=0)

    # Phase 2.1 Enhanced Features
    principal_only_grace = Column(Boolean, nullable=False, default=False) # True for principal-only grace
    full_grace = Column(Boolean, nullable=False, default=False) # True for full grace period
    origination_fee_rate = Column(Numeric(10, 4), nullable=True) # Percentage for origination fee
    origination_fee_type = Column(String(50), nullable=True) # "upfront" | "spread"
    prepayment_allowed = Column(Boolean, nullable=False, default=True) # True if prepayment allowed
    prepayment_penalty_rate = Column(Numeric(10, 4), nullable=True) # Percentage for prepayment penalty
    customer_loan_limit = Column(Numeric(14, 2), nullable=True) # Maximum borrowing per customer (0 = unlimited)

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Loan Applications
# ---------------------------------------------------------------------------
class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # Mongo references
    customer_id = Column(String(64), nullable=False, index=True)
    
    # Relations
    product_id = Column(BigInteger, ForeignKey("loan_products.id"), nullable=False)
    product = relationship("PGLoanProduct")

    # Application Details
    principal = Column(Numeric(14, 2), nullable=False)
    term_months = Column(BigInteger, nullable=False)
    
    # Approval Details
    approved_principal = Column(Numeric(14, 2), nullable=True)
    approved_rate = Column(Numeric(10, 4), nullable=True)
    
    status = Column(String(50), nullable=False, default="draft")
    # Statuses: draft, submitted, reviewing, approved, active, paid, rejected, defaulted

    review_note = Column(Text, nullable=True)
    disbursement_method = Column(String(50), nullable=True)  # cash | bank_transfer | cheque | savings_transfer

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    disbursed_at = Column(DateTime(timezone=True), nullable=True)

    schedules = relationship("AmortizationSchedule", back_populates="loan", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Loan Collateral
# ---------------------------------------------------------------------------
class LoanCollateral(Base):
    __tablename__ = "loan_collateral"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loan_applications.id"), nullable=False, index=True)
    
    type = Column(String(100), nullable=False) # "vehicle" | "real_estate" | "deposit"
    value = Column(Numeric(14, 2), nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Loan Guarantors
# ---------------------------------------------------------------------------
class LoanGuarantor(Base):
    __tablename__ = "loan_guarantors"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loan_applications.id"), nullable=False, index=True)
    
    # Mongo reference
    customer_id = Column(String(64), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Amortization Schedule
# ---------------------------------------------------------------------------
class AmortizationSchedule(Base):
    __tablename__ = "amortization_schedules"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loan_applications.id"), nullable=False, index=True)
    loan = relationship("LoanApplication", back_populates="schedules")
    
    installment_number = Column(BigInteger, nullable=False)
    due_date = Column(Date, nullable=False)
    
    # Expected
    principal_due = Column(Numeric(14, 2), nullable=False)
    interest_due = Column(Numeric(14, 2), nullable=False)
    penalty_due = Column(Numeric(14, 2), nullable=False, default=0)
    
    # Actual payments applied
    principal_paid = Column(Numeric(14, 2), nullable=False, default=0)
    interest_paid = Column(Numeric(14, 2), nullable=False, default=0)
    penalty_paid = Column(Numeric(14, 2), nullable=False, default=0)
    
    status = Column(String(50), nullable=False, default="pending") 
    # pending, partial, paid, overdue

    UNIQUE_CONSTRAINT = UniqueConstraint("loan_id", "installment_number", name="uq_loan_installment")


# ---------------------------------------------------------------------------
# Loan Transactions
# ---------------------------------------------------------------------------
class LoanTransaction(Base):
    __tablename__ = "loan_transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loan_applications.id"), nullable=False, index=True)
    
    type = Column(String(50), nullable=False) # "disbursement" | "repayment" | "fee"
    amount = Column(Numeric(14, 2), nullable=False)
    
    receipt_number = Column(String(100), nullable=True, unique=True)
    description = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_by = Column(String(64), nullable=True) # mongo user id
