"""
Data Migration Script: MongoDB to PostgreSQL

This script migrates existing MongoDB data to PostgreSQL 16.

⚠️  IMPORTANT: Run this script BEFORE switching the application to PostgreSQL-only mode.
"""

import asyncio
import os
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import uuid4

# MongoDB imports
try:
    import motor.motor_asyncio
    from bson import ObjectId
except ImportError:
    motor = None
    ObjectId = None
    print("⚠️  MongoDB drivers not installed. Skipping MongoDB migration.")

# PostgreSQL imports
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
except ImportError:
    print("❌ SQLAlchemy not installed. Install with: pip install sqlalchemy[asyncio]")
    exit(1)

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database.pg_core_models import (
    User, Customer, SavingsAccount, SavingsTransaction, Loan, LoanTransaction,
    AmortizationSchedule, Transaction, LedgerEntry, StandingOrder, InterestLedger
)
from backend.app.database.pg_loan_models import PGLoanProduct
from backend.app.database.pg_models import Branch
from backend.app.database.pg_accounting_models import GLAccount, JournalEntry, JournalLine


# Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://lending_mongo:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "lending_mvp")
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://lending_user:lending_secret@localhost:5432/lending_db")


class DataMigrator:
    def __init__(self):
        self.mongo_client = None
        self.mongo_db = None
        self.pg_engine = None
        self.pg_sessionmaker = None
        
    async def connect_mongodb(self):
        """Connect to MongoDB source."""
        if not motor:
            raise ImportError("MongoDB drivers not installed")
        
        self.mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
        self.mongo_db = self.mongo_client[MONGO_DB_NAME]
        print(f"✅ Connected to MongoDB: {MONGO_DB_NAME}")
        
    async def connect_postgresql(self):
        """Connect to PostgreSQL target."""
        self.pg_engine = create_async_engine(POSTGRES_URL, echo=False)
        self.pg_sessionmaker = sessionmaker(
            self.pg_engine, class_=AsyncSession, expire_on_commit=False
        )
        print(f"✅ Connected to PostgreSQL: {POSTGRES_URL}")
        
    async def close_connections(self):
        """Close all connections."""
        if self.mongo_client:
            self.mongo_client.close()
        if self.pg_engine:
            await self.pg_engine.dispose()
            
    async def migrate_branches(self):
        """Migrate branches collection."""
        print("\n📊 Migrating branches...")
        try:
            branches = await self.mongo_db.branches.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for branch in branches:
                    db_branch = Branch(
                        code=branch.get('code', ''),
                        name=branch.get('name', ''),
                        address=branch.get('address'),
                        city=branch.get('city'),
                        contact_number=branch.get('contact_number'),
                        is_active=branch.get('is_active', True),
                    )
                    session.add(db_branch)
                
                await session.commit()
                
            print(f"✅ Migrated {len(branches)} branches")
            return True
        except Exception as e:
            print(f"❌ Error migrating branches: {e}")
            return False
            
    async def migrate_users(self):
        """Migrate users collection."""
        print("\n📊 Migrating users...")
        try:
            users = await self.mongo_db.users.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for user in users:
                    db_user = User(
                        email=user.get('email', ''),
                        username=user.get('username', ''),
                        full_name=user.get('full_name', ''),
                        role=user.get('role', ''),
                        branch_id=user.get('branch_id'),
                        branch_code=user.get('branch_code'),
                        hashed_password=user.get('hashed_password', ''),
                        is_active=user.get('is_active', True),
                        is_superuser=user.get('is_superuser', False),
                    )
                    session.add(db_user)
                
                await session.commit()
                
            print(f"✅ Migrated {len(users)} users")
            return True
        except Exception as e:
            print(f"❌ Error migrating users: {e}")
            return False
            
    async def migrate_customers(self):
        """Migrate customers collection."""
        print("\n📊 Migrating customers...")
        try:
            customers = await self.mongo_db.customers.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for customer in customers:
                    db_customer = Customer(
                        customer_type=customer.get('customer_type', 'individual'),
                        last_name=customer.get('last_name'),
                        first_name=customer.get('first_name'),
                        middle_name=customer.get('middle_name'),
                        display_name=customer.get('display_name', ''),
                        tin_no=customer.get('tin_no'),
                        sss_no=customer.get('sss_no'),
                        birth_date=customer.get('birth_date'),
                        birth_place=customer.get('birth_place'),
                        mobile_number=customer.get('mobile_number'),
                        email_address=customer.get('email_address'),
                        permanent_address=customer.get('permanent_address'),
                        employer_name_address=customer.get('employer_name_address'),
                        job_title=customer.get('job_title'),
                        salary_range=customer.get('salary_range'),
                        company_name=customer.get('company_name'),
                        company_address=customer.get('company_address'),
                        branch_id=customer.get('branch_id'),
                        branch_code=customer.get('branch_code'),
                        is_active=customer.get('is_active', True),
                    )
                    session.add(db_customer)
                
                await session.commit()
                
            print(f"✅ Migrated {len(customers)} customers")
            return True
        except Exception as e:
            print(f"❌ Error migrating customers: {e}")
            return False
            
    async def migrate_savings_accounts(self):
        """Migrate savings collection."""
        print("\n📊 Migrating savings accounts...")
        try:
            savings = await self.mongo_db.savings.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for account in savings:
                    db_account = SavingsAccount(
                        account_number=account.get('account_number', ''),
                        display_name=account.get('display_name', ''),
                        customer_id=account.get('customer_id'),
                        account_type=account.get('account_type', 'regular'),
                        primary_owner_id=account.get('primary_owner_id'),
                        secondary_owner_id=account.get('secondary_owner_id'),
                        current_balance=Decimal(str(account.get('current_balance', 0))),
                        minimum_balance=Decimal(str(account.get('minimum_balance', 1000))),
                        interest_rate=Decimal(str(account.get('interest_rate', 0.5))),
                        last_interest_date=account.get('last_interest_date'),
                        is_active=account.get('is_active', True),
                        status=account.get('status', 'active'),
                        branch_id=account.get('branch_id'),
                        branch_code=account.get('branch_code'),
                    )
                    session.add(db_account)
                
                await session.commit()
                
            print(f"✅ Migrated {len(savings)} savings accounts")
            return True
        except Exception as e:
            print(f"❌ Error migrating savings accounts: {e}")
            return False
            
    async def migrate_savings_transactions(self):
        """Migrate savings transactions from transactions collection."""
        print("\n📊 Migrating savings transactions...")
        try:
            transactions = await self.mongo_db.transactions.find({
                "transaction_type": {"$in": ["deposit", "withdrawal", "transfer"]}
            }).to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for tx in transactions:
                    db_tx = SavingsTransaction(
                        transaction_id=tx.get('transaction_id', ''),
                        account_id=tx.get('account_id'),
                        transaction_type=tx.get('transaction_type', ''),
                        amount=Decimal(str(tx.get('amount', 0))),
                        balance_after=Decimal(str(tx.get('balance_after', 0))) if tx.get('balance_after') else None,
                        description=tx.get('description'),
                        reference=tx.get('reference'),
                        status=tx.get('status', 'completed'),
                        timestamp=tx.get('timestamp', datetime.utcnow()),
                        processed_by=tx.get('processed_by'),
                        processed_by_username=tx.get('processed_by_username'),
                        branch_id=tx.get('branch_id'),
                        branch_code=tx.get('branch_code'),
                    )
                    session.add(db_tx)
                
                await session.commit()
                
            print(f"✅ Migrated {len(transactions)} savings transactions")
            return True
        except Exception as e:
            print(f"❌ Error migrating savings transactions: {e}")
            return False
            
    async def migrate_loans(self):
        """Migrate loans collection."""
        print("\n📊 Migrating loans...")
        try:
            loans = await self.mongo_db.loans.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for loan in loans:
                    db_loan = Loan(
                        loan_id=loan.get('loan_id', ''),
                        customer_id=loan.get('customer_id'),
                        product_id=loan.get('product_id'),
                        principal=Decimal(str(loan.get('principal', 0))),
                        interest_rate=Decimal(str(loan.get('interest_rate', 0))),
                        term_months=loan.get('term_months', 0),
                        status=loan.get('status', 'pending'),
                        disbursement_date=loan.get('disbursement_date'),
                        disbursement_amount=Decimal(str(loan.get('disbursement_amount', 0))) if loan.get('disbursement_amount') else None,
                        branch_id=loan.get('branch_id'),
                        branch_code=loan.get('branch_code'),
                    )
                    session.add(db_loan)
                
                await session.commit()
                
            print(f"✅ Migrated {len(loans)} loans")
            return True
        except Exception as e:
            print(f"❌ Error migrating loans: {e}")
            return False
            
    async def migrate_loan_transactions(self):
        """Migrate loan transactions."""
        print("\n📊 Migrating loan transactions...")
        try:
            loan_txs = await self.mongo_db.loan_transactions.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for tx in loan_txs:
                    db_tx = LoanTransaction(
                        loan_id=tx.get('loan_id'),
                        transaction_id=tx.get('transaction_id', ''),
                        transaction_type=tx.get('transaction_type', ''),
                        amount=Decimal(str(tx.get('amount', 0))),
                        receipt_number=tx.get('receipt_number'),
                        description=tx.get('description'),
                        timestamp=tx.get('timestamp', datetime.utcnow()),
                        processed_by=tx.get('processed_by'),
                    )
                    session.add(db_tx)
                
                await session.commit()
                
            print(f"✅ Migrated {len(loan_txs)} loan transactions")
            return True
        except Exception as e:
            print(f"❌ Error migrating loan transactions: {e}")
            return False
            
    async def migrate_ledger_entries(self):
        """Migrate ledger entries."""
        print("\n📊 Migrating ledger entries...")
        try:
            ledger = await self.mongo_db.ledger_entries.find().to_list(length=None)
            
            async with self.pg_sessionmaker() as session:
                for entry in ledger:
                    db_entry = LedgerEntry(
                        transaction_id=entry.get('transaction_id', ''),
                        journal_entry_id=None,  # Will be populated later if needed
                        account_code=entry.get('account', ''),
                        amount=Decimal(str(entry.get('amount', 0))),
                        entry_type=entry.get('entry_type', ''),
                        timestamp=entry.get('timestamp', datetime.utcnow()),
                        reference=entry.get('reference'),
                        description=entry.get('description'),
                        branch_id=entry.get('branch_id'),
                        branch_code=entry.get('branch_code'),
                    )
                    session.add(db_entry)
                
                await session.commit()
                
            print(f"✅ Migrated {len(ledger)} ledger entries")
            return True
        except Exception as e:
            print(f"❌ Error migrating ledger entries: {e}")
            return False
            
    async def run_all_migrations(self):
        """Run all migrations."""
        print("=" * 60)
        print("📊 DATA MIGRATION: MongoDB → PostgreSQL 16")
        print("=" * 60)
        
        try:
            await self.connect_mongodb()
            await self.connect_postgresql()
            
            migrations = [
                self.migrate_branches,
                self.migrate_users,
                self.migrate_customers,
                self.migrate_savings_accounts,
                self.migrate_savings_transactions,
                self.migrate_loans,
                self.migrate_loan_transactions,
                self.migrate_ledger_entries,
            ]
            
            results = []
            for migration in migrations:
                results.append(await migration())
            
            print("\n" + "=" * 60)
            print("📊 MIGRATION SUMMARY")
            print("=" * 60)
            for i, result in enumerate(results):
                status = "✅ SUCCESS" if result else "❌ FAILED"
                print(f"{status}: {migrations[i].__name__.replace('migrate_', '')}")
            
            await self.close_connections()
            
            if all(results):
                print("\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!")
            else:
                print("\n⚠️  SOME MIGRATIONS FAILED - Check logs above")
                
        except Exception as e:
            print(f"\n❌ MIGRATION FAILED: {e}")
            await self.close_connections()
            raise


async def main():
    """Main entry point."""
    migrator = DataMigrator()
    
    print("⚠️  WARNING: This will migrate data from MongoDB to PostgreSQL")
    print("⚠️  Make sure PostgreSQL is running and accessible!")
    print()
    
    confirm = input("Continue with migration? (yes/no): ").strip().lower()
    
    if confirm != "yes":
        print("Migration cancelled.")
        return
        
    await migrator.run_all_migrations()


if __name__ == "__main__":
    asyncio.run(main())