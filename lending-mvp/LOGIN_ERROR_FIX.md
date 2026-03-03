# Login Error Fix: Missing "users" Table

## Problem
```
sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError: <class 'asyncpg.exceptions.UndefinedTableError'>: 
relation "users" does not exist
```

This error occurs because the PostgreSQL database migrations were never executed before the application started. The `users` table (defined in `pg_core_models.py`) was never created.

## Root Cause
The Docker container was starting the FastAPI backend **before** running Alembic migrations. The database was empty, so any login attempt failed immediately.

## Solution

### What Was Fixed

1. **Created Migration Runner Script** (`backend/scripts/run_migrations.py`)
   - Waits for PostgreSQL to become healthy
   - Runs Alembic migrations automatically
   - Handles retries and timeouts gracefully

2. **Created New Migration** (`backend/alembic/versions/002_create_users_customers_transactions.py`)
   - Creates the `users` table
   - Creates `customers` table
   - Creates `savings_accounts` table
   - Creates `transaction_ledger` table
   - Includes proper indexes for performance

3. **Created Admin Seeder Script** (`backend/scripts/seed_admin_user.py`)
   - Automatically creates a default admin user after migrations
   - Credentials: `admin` / `admin123`
   - Creates a default "HQ" branch if needed
   - Only runs if admin user doesn't already exist

4. **Updated Backend Dockerfile** (`backend/Dockerfile`)
   - Added Alembic and migration scripts to container
   - Added psycopg2 for Alembic (Alembic uses sync drivers)
   - Created entrypoint script that:
     1. Runs migrations (`run_migrations.py`)
     2. Seeds admin user (`seed_admin_user.py`)
     3. Starts FastAPI

5. **Updated Alembic Configuration** (`backend/alembic/env.py`)
   - Added import of `pg_core_models` so the `User` model is registered
   - Ensures migrations pick up all table definitions

### How It Works Now

```
Docker Startup Flow:
    ↓
PostgreSQL Container (waits for health check)
    ↓
Entrypoint Script Runs
    ↓
1. Run Migrations (run_migrations.py)
   - Wait for DB connection ✓
   - Execute alembic upgrade head
   - Creates all tables
    ↓
2. Seed Admin User (seed_admin_user.py)
   - Creates default admin user
   - Creates default branch
    ↓
3. Start FastAPI
   - app.main:app starts
   - Ready for requests
```

## How to Use

### 1. Rebuild the Docker Image
```bash
cd /home/ubuntu/Github/financing/lending-mvp
docker-compose down
docker-compose build --no-cache backend
```

### 2. Start Services
```bash
docker-compose up -d
```

The backend will automatically:
- Wait for PostgreSQL to be ready
- Run all pending migrations
- Seed the admin user
- Start the FastAPI server

### 3. Test Login
Once services are running:
- **URL**: `http://localhost:3010` (frontend) or API endpoint
- **Username**: `admin`
- **Password**: `admin123`

### 4. Check Logs
```bash
# Watch migration logs
docker-compose logs -f backend

# You should see:
# 🔄 Running database migrations...
# 🌱 Seeding default data...
# ✅ Setup complete. Starting FastAPI...
```

## Database Schema

The migration creates these tables:

### `users` Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE,
    email VARCHAR(200) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    hashed_password VARCHAR(200) NOT NULL,
    role VARCHAR(50),  -- admin, manager, staff, teller
    branch_id INTEGER REFERENCES branches(id),
    branch_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `customers` Table
Extended customer information with address, employment, income fields.

### `savings_accounts` Table
Customer savings account tracking.

### `transaction_ledger` Table
Transaction history and ledger entries.

## Troubleshooting

### Still Getting "relation users does not exist"?

1. **Check if backend restarted after Docker build**:
   ```bash
   docker-compose ps
   docker-compose logs backend | tail -50
   ```

2. **Manually run migrations**:
   ```bash
   docker-compose exec backend python /app/scripts/run_migrations.py
   ```

3. **Check if PostgreSQL is ready**:
   ```bash
   docker-compose logs postgres | grep "database system is ready"
   ```

4. **Reset database completely**:
   ```bash
   docker-compose down -v  # Remove volumes
   docker-compose up -d    # Fresh start
   ```

### Admin User Not Created?

Check logs:
```bash
docker-compose logs backend | grep -A5 "Seeding"
```

Manually create user:
```bash
docker-compose exec backend python /app/scripts/seed_admin_user.py
```

### Migration Failed?

Check the Alembic logs in detail:
```bash
docker-compose logs backend | grep -A20 "Running database migrations"
```

## Testing Checklist

- [ ] Docker builds without errors
- [ ] Container starts and runs migrations
- [ ] Admin user created successfully
- [ ] Login works with `admin` / `admin123`
- [ ] No database errors in logs
- [ ] Frontend can authenticate
- [ ] Dashboard loads after login

## Files Modified

```
backend/
  ├── Dockerfile (updated - runs migrations on startup)
  ├── alembic.ini (no changes needed)
  ├── alembic/
  │   ├── env.py (updated - imports pg_core_models)
  │   └── versions/
  │       └── 002_create_users_customers_transactions.py (NEW)
  └── scripts/
      ├── run_migrations.py (NEW - migration runner)
      └── seed_admin_user.py (NEW - admin seeder)
```

## Next Steps

1. **Security**: Change admin password after first login
2. **Backup**: Set up PostgreSQL backups
3. **Additional Users**: Create users through admin panel
4. **Production**: Don't use `admin123` - generate strong password
5. **Monitoring**: Set up logging for migrations
