# PostgreSQL 16 Setup Guide

## Quick Start

### 1. Verify Docker is Running
```bash
docker --version
docker-compose --version
```

### 2. Start PostgreSQL 16
```bash
docker-compose up -d postgres redis
```

### 3. Verify PostgreSQL is Running
```bash
docker exec -it lending_postgres psql -U lending_user -d lending_db -c "SELECT version();"
```

### 4. Initialize Database Schema
```bash
docker exec -it lending_backend python -c "
import asyncio
from app.database import create_tables

asyncio.run(create_tables())
"
```

### 5. Run Data Migration (if migrating from MongoDB)
```bash
docker exec -it lending_backend python scripts/migrate_mongodb_to_postgres.py
```

### 6. Start Full Stack
```bash
docker-compose up -d
```

## Database Details

- **Host**: `localhost`
- **Port**: `5433` (host) → `5432` (container)
- **Database**: `lending_db`
- **User**: `lending_user`
- **Password**: `lending_secret`

### Environment Variables

Add these to your `.env` file:
```env
# PostgreSQL 16
DATABASE_URL=postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db

# Redis (for sessions/cache)
REDIS_URL=redis://:${REDIS_PASSWORD:-lending_redis_pass}@redis:6379/0
```

## Available Models

The following models are now available in PostgreSQL:

### Core Models
- `User` - Authentication and user management
- `Customer` - Customer information (individual/corporate)
- `SavingsAccount` - Savings accounts with balances
- `SavingsTransaction` - Savings account transactions
- `Loan` - Loan records with status
- `LoanTransaction` - Loan-specific transactions
- `AmortizationSchedule` - Loan payment schedules
- `Transaction` - General transactions
- `LedgerEntry` - Accounting ledger entries
- `StandingOrder` - Automated payments
- `InterestLedger` - Interest posting history

### Support Models
- `Branch` - Branch office information
- `AuditLog` - Audit trail
- `UserSession` - Active sessions
- `KYCDocument` - KYC documents
- `Beneficiary` - Next of kin
- `CustomerActivity` - Customer activity logs
- `PasswordHistory` - Password history
- `AMLAlert` - AML compliance alerts
- `PEPRecord` - PEP database

### Loan Models
- `PGLoanProduct` - Loan products
- `LoanApplication` - Loan applications
- `LoanCollateral` - Collateral information
- `LoanGuarantor` - Guarantor information
- `CreditScore` - Credit scoring
- `LoanApplicationDocument` - Documents
- `DisbursementChecklist` - Disbursement checklist
- `LoanTranche` - Tranche releases
- `PromiseToPay` - PTP tracking
- `LoanRestructureLog` - Restructure history

### Accounting Models
- `GLAccount` - General ledger accounts
- `JournalEntry` - Journal entries
- `JournalLine` - Journal lines

## Using PostgreSQL 16 with SQLAlchemy

### Basic Query Example
```python
from sqlalchemy import select
from app.database import get_db_session
from app.database.pg_core_models import User

async def get_users():
    async with get_db_session() as session:
        result = await session.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()
        return users
```

### Creating Records
```python
from app.database.pg_core_models import Customer
from app.database import get_db_session

async def create_customer(data):
    async with get_db_session() as session:
        customer = Customer(**data)
        session.add(customer)
        await session.commit()
        await session.refresh(customer)
        return customer
```

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres
```

### Schema Errors
```bash
# Drop and recreate schema
docker exec -it lending_backend python -c "
import asyncio
from app.database import drop_tables, create_tables

async def reset():
    await drop_tables()
    await create_tables()

asyncio.run(reset())
"
```

### Data Migration Issues
```bash
# Check MongoDB is accessible
docker exec -it lending_mongo mongosh --eval "db.version()"

# Check MongoDB data
docker exec -it lending_mongo mongosh lending_mvp --eval "db.users.countDocuments()"
```

## Next Steps

1. ✅ Run migrations for existing data
2. ✅ Update backend code to use PostgreSQL models
3. ✅ Run tests to verify functionality
4. ✅ Deploy to production

## Notes

- PostgreSQL 16 provides better JSON support and improved performance
- All existing MongoDB collections will be migrated to PostgreSQL tables
- Redis is still used for sessions and caching
- MongoDB can be completely removed after successful migration