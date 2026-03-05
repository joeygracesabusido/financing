
import asyncio
import os
import sys

# Add backend directory to path
backend_path = os.path.abspath(os.path.join(os.getcwd(), "lending-mvp", "backend"))
sys.path.append(backend_path)

# Set environment variables if needed
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@localhost:5433/lending_db"

from app.database import get_async_session_local
from app.database.pg_loan_models import LoanApplication, LoanTransaction
from sqlalchemy import select, func

async def check_data():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Check Loans
        try:
            loan_stmt = select(func.count()).select_from(LoanApplication)
            loan_count = await session.execute(loan_stmt)
            print(f"Total Loan Applications: {loan_count.scalar()}")
            
            loans = await session.execute(select(LoanApplication).limit(10))
            for l in loans.scalars().all():
                print(f"Loan ID: {l.id}, Customer: {l.customer_id}, Principal: {l.principal}, Status: {l.status}")
        except Exception as e:
            print(f"Error checking loans: {e}")

        # Check Transactions
        try:
            tx_stmt = select(func.count()).select_from(LoanTransaction)
            tx_count = await session.execute(tx_stmt)
            print(f"\nTotal Loan Transactions: {tx_count.scalar()}")
            
            txs = await session.execute(select(LoanTransaction).limit(10))
            for tx in txs.scalars().all():
                print(f"TX ID: {tx.id}, Loan ID: {tx.loan_id}, Amount: {tx.amount}, Type: {tx.type}")
        except Exception as e:
            print(f"Error checking transactions: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
