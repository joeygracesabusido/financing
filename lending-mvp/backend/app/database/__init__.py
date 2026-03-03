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


def get_db():
    """Get database session for MongoDB compatibility."""
    return AsyncSessionLocal()


# ============================================================================
# MongoDB Compatibility Layer (Temporary)
# ============================================================================

class MockCollection:
    """Mock MongoDB collection for compatibility during migration."""
    async def find(self, *args, **kwargs):
        return MockCursor()
    
    async def find_one(self, *args, **kwargs):
        return None
    
    async def insert_one(self, *args, **kwargs):
        return MockInsertResult()
    
    async def insert_many(self, *args, **kwargs):
        return MockInsertManyResult()
    
    async def update_one(self, *args, **kwargs):
        return MockUpdateResult()
    
    async def delete_one(self, *args, **kwargs):
        return MockDeleteResult()
    
    async def count_documents(self, *args, **kwargs):
        return 0
    
    async def sort(self, *args, **kwargs):
        return self
    
    async def limit(self, *args, **kwargs):
        return self


class MockCursor:
    """Mock MongoDB cursor."""
    async def to_list(self, *args, **kwargs):
        return []
    
    async def next(self, *args, **kwargs):
        return None


class MockInsertResult:
    """Mock MongoDB insert result."""
    inserted_id = None


class MockInsertManyResult:
    """Mock MongoDB insert many result."""
    inserted_ids = []


class MockUpdateResult:
    """Mock MongoDB update result."""
    modified_count = 0


class MockDeleteResult:
    """Mock MongoDB delete result."""
    deleted_count = 0


# MongoDB collection stubs
customers_collection = MockCollection()
loans_collection = MockCollection()
savings_collection = MockCollection()
ledger_collection = MockCollection()
users_collection = MockCollection()
branches_collection = MockCollection()
chart_of_accounts_collection = MockCollection()
loan_products_collection = MockCollection()
loan_transactions_collection = MockCollection()
savings_transactions_collection = MockCollection()


def get_customers_collection():
    """Return customers collection for MongoDB compatibility."""
    return customers_collection


def get_loans_collection():
    """Return loans collection for MongoDB compatibility."""
    return loans_collection


def get_savings_collection():
    """Return savings collection for MongoDB compatibility."""
    return savings_collection


def get_ledger_collection():
    """Return ledger collection for MongoDB compatibility."""
    return ledger_collection


def get_users_collection():
    """Return users collection for MongoDB compatibility."""
    return users_collection


def get_branches_collection():
    """Return branches collection for MongoDB compatibility."""
    return branches_collection


def get_chart_of_accounts_collection():
    """Return chart of accounts collection for MongoDB compatibility."""
    return chart_of_accounts_collection


def get_loan_products_collection():
    """Return loan products collection for MongoDB compatibility."""
    return loan_products_collection


def get_loan_transactions_collection():
    """Return loan transactions collection for MongoDB compatibility."""
    return loan_transactions_collection


def get_savings_transactions_collection():
    """Return savings transactions collection for MongoDB compatibility."""
    return savings_transactions_collection


def get_transactions_collection():
    """Return transactions collection for MongoDB compatibility."""
    return loans_collection


async def create_mongo_client():
    """Create MongoDB client for compatibility during migration."""
    return None