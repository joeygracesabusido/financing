# Exact Changes Made to Fix Login Error

## Summary
Fixed the `UndefinedTableError: relation "users" does not exist` error by ensuring database migrations run automatically when the container starts.

---

## Files Created (3 new files)

### 1. `backend/scripts/run_migrations.py`
**Purpose**: Automatically runs Alembic migrations with connection retry logic

**Key Features**:
- Waits for PostgreSQL to be ready (up to 30 retries with exponential backoff)
- Converts asyncpg URL to psycopg2 URL (Alembic requirement)
- Logs each step clearly
- Exits with error code if anything fails

### 2. `backend/scripts/seed_admin_user.py`
**Purpose**: Creates default admin user after migrations

**Key Features**:
- Only creates user if doesn't exist
- Creates default "HQ" branch if needed
- Default credentials: `admin` / `admin123`
- Uses bcrypt for password hashing
- Async implementation

### 3. `backend/alembic/versions/002_create_users_customers_transactions.py`
**Purpose**: Alembic migration that creates core tables

**Creates these tables**:
- `users` - User accounts (replaces MongoDB)
- `customers` - Customer information
- `savings_accounts` - Customer savings
- `transaction_ledger` - Transaction history

**Migration Chain**:
- Revision ID: `002_create_users_customers_transactions`
- Previous: `f5cf49589157` (Phase 2 tables)
- Includes full up/down (downgrade) support

---

## Files Modified (2 files)

### 1. `backend/Dockerfile`
**Changes**:
```dockerfile
# ADDED: Copy alembic configuration
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini

# ADDED: Copy migration scripts
COPY ./scripts /app/scripts

# ADDED: Install psycopg2 for Alembic
RUN pip install --no-cache-dir psycopg2-binary

# CHANGED: Create entrypoint script instead of direct command
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🔄 Running database migrations..."\n\
python /app/scripts/run_migrations.py\n\
echo "🌱 Seeding default data..."\n\
python /app/scripts/seed_admin_user.py\n\
echo "✅ Setup complete. Starting FastAPI..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# CHANGED: Use entrypoint script
CMD ["/app/entrypoint.sh"]
```

**Old Behavior**: Started FastAPI immediately (database not ready)
**New Behavior**: Runs migrations → seeds data → starts FastAPI

### 2. `backend/alembic/env.py`
**Changes**:
```python
# ADDED: Import pg_core_models
import app.database.pg_core_models  # Users, Customers, Transactions
```

**Reason**: Alembic needs to know about all models to generate correct migrations. The `User` model in `pg_core_models.py` defines the `users` table structure.

---

## Execution Flow (New)

```
Docker Container Starts
    ↓
entrypoint.sh runs
    ↓
run_migrations.py
  ├─ Check PostgreSQL connection (with retries)
  ├─ Run: alembic upgrade head
  └─ Creates all tables
    ↓
seed_admin_user.py
  ├─ Creates default branch "HQ"
  ├─ Creates admin user
  └─ Sets password: admin123
    ↓
FastAPI Server Starts
    ↓
Ready for requests
```

---

## Impact

### Before Fix
- Backend starts without migrations
- Login attempt queries non-existent `users` table
- Database error: `UndefinedTableError`
- Cannot login

### After Fix
- Backend waits for PostgreSQL
- Runs all migrations automatically
- Creates all required tables
- Seeds admin user
- Login works immediately
- No manual setup needed

---

## Testing Steps

1. **Rebuild image**:
   ```bash
   docker-compose down
   docker-compose build --no-cache backend
   ```

2. **Start containers**:
   ```bash
   docker-compose up -d
   ```

3. **Check logs**:
   ```bash
   docker-compose logs backend | grep -E "(migrations|Seeding|Setup complete)"
   ```

4. **Try login**:
   - URL: http://localhost:3010
   - Username: `admin`
   - Password: `admin123`

5. **Verify no errors**:
   ```bash
   docker-compose logs backend | grep -i error
   ```

---

## Fallback/Troubleshooting

If login still fails:

1. **Manual migration run**:
   ```bash
   docker-compose exec backend python /app/scripts/run_migrations.py
   ```

2. **Manual seed admin**:
   ```bash
   docker-compose exec backend python /app/scripts/seed_admin_user.py
   ```

3. **Check PostgreSQL**:
   ```bash
   docker-compose exec postgres psql -U lending_user -d lending_db -c "\dt"
   ```
   Should show: `users`, `customers`, `savings_accounts`, etc.

4. **Full reset**:
   ```bash
   docker-compose down -v     # Remove all volumes
   docker-compose build       # Rebuild
   docker-compose up -d       # Fresh start
   ```

---

## Files Not Modified But Important

- `backend/app/database/pg_core_models.py` - Defines `User` model (NOT modified, already had correct schema)
- `backend/app/database/base.py` - SQLAlchemy Base class
- `backend/alembic.ini` - Alembic config (already correct)

---

## Database Schema Breakdown

### users table (created by migration)
```sql
id              BIGINT PRIMARY KEY
uuid            VARCHAR(36) UNIQUE
email           VARCHAR(200) UNIQUE NOT NULL
username        VARCHAR(100) UNIQUE NOT NULL
full_name       VARCHAR(200) NOT NULL
hashed_password VARCHAR(200) NOT NULL
role            VARCHAR(50)
branch_id       INTEGER (FK to branches.id)
branch_code     VARCHAR(20)
is_active       BOOLEAN DEFAULT true
is_superuser    BOOLEAN DEFAULT false
created_at      TIMESTAMP WITH TIME ZONE
updated_at      TIMESTAMP WITH TIME ZONE
```

---

## Environment Variables Used

- `DATABASE_URL`: PostgreSQL connection string
  - Default: `postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db`
  - Automatically converted to `postgresql://...` for Alembic

---

## Next Production Steps

1. Change admin password after first login
2. Create additional users through admin panel
3. Set up proper user roles and permissions
4. Enable audit logging
5. Configure branch assignments
6. Set up database backups

---

## Verification Checklist

- [x] Migration files are executable
- [x] Alembic env.py imports all models
- [x] Dockerfile copies all necessary files
- [x] Entrypoint script has proper error handling
- [x] Seed script creates admin user
- [x] Retry logic handles slow database startup
- [x] All new tables have indexes
- [x] Migration includes downgrade logic
- [x] Default credentials are documented
- [x] Logs are clear and helpful
