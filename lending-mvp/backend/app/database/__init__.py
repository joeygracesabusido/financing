"""
PostgreSQL-only database initialization.
Replaces MongoDB-based database initialization.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from ..config import settings

# Import all models to register them with Base
from .pg_core_models import (
    User, Customer, SavingsAccount, SavingsTransaction, Loan, LoanTransaction,
    AmortizationSchedule, Transaction, LedgerEntry, StandingOrder, InterestLedger
)
from .pg_loan_models import (
    PGLoanProduct, LoanApplication, LoanCollateral, LoanGuarantor,
    CreditScore, LoanApplicationDocument, DisbursementChecklist, LoanTranche, PromiseToPay, LoanRestructureLog
)
from .pg_models import (
    Branch, UserBranchAssignment, AuditLog, UserSession, KYCDocument,
    Beneficiary, CustomerActivity, PasswordHistory, AMLAlert, PEPRecord
)
from .pg_accounting_models import GLAccount, JournalEntry, JournalLine

# Async SQLAlchemy engine
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db_session():
    """FastAPI dependency that yields a PostgreSQL async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all PostgreSQL tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("PostgreSQL tables created successfully.")


async def drop_tables():
    """Drop all PostgreSQL tables (use with caution!)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("PostgreSQL tables dropped successfully.")