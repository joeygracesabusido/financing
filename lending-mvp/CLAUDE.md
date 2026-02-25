# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lending and savings management application built as an MVP with:

- **Backend:** FastAPI + Strawberry GraphQL (Python 3.10)
- **Frontend:** Vanilla JavaScript + jQuery + Tailwind CSS
- **Database:** MongoDB (Motor async driver) + Redis (caching/token blacklisting)
- **Infrastructure:** Docker Compose with Nginx for frontend serving

## Quick Start

```bash
cd /home/jerome-sabusido/Desktop/financing/lending-mvp
docker-compose up --build
```

**Access:**
- GraphQL Playground: http://localhost:8001/graphql
- Frontend: http://localhost:8080
- MongoDB: localhost:27017 (internal)

## Architecture

```
Frontend (Vanilla JS/jQuery + Tailwind)
         ↓ HTTP
FastAPI Backend (port 8001)
    ↓ GraphQL          ↓ REST (bridge)
Strawberry Schema   /api-login/
    ↓
Service Layer (loan_service, accounting_service)
    ↓
Database Layer (Motor CRUD)
    ↓
MongoDB + Redis
```

## Key Patterns

1. **Authentication:** JWT tokens stored in localStorage. Bearer token required in `Authorization` header for mutations. GET requests to GraphQL are allowed for introspection.

2. **Caching:** Redis caches expensive queries (`loan:{id}`, `loans:list:{skip}:{limit}`). Clear caches via `_clear_*_cache` methods in mutations.

3. **Double-Entry Accounting:** `accounting_service.py` handles atomic debit/credit transactions using MongoDB sessions.

4. **Pydantic Models:** All database interactions should use models in `basemodel/` for schema consistency.

5. **Decimal Handling:** MongoDB doesn't natively support Python's Decimal - fields are converted to float for storage.

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f mongodb

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose up --build
```

## File Structure

```
lending-mvp/
├── backend/app/
│   ├── main.py           # FastAPI app entry, GraphQL router setup
│   ├── schema.py         # Core GraphQL schema types
│   ├── config.py         # Settings (DATABASE_URL, JWT_SECRET, etc.)
│   ├── user.py           # User GraphQL resolvers
│   ├── customer.py       # Customer resolvers
│   ├── savings.py        # Savings account resolvers
│   ├── transaction.py    # Transaction resolvers
│   ├── loan.py           # Loan resolvers
│   ├── loan_transaction.py  # Loan transaction resolvers
│   ├── loan_product.py   # Loan product resolvers
│   ├── recent_transactions.py  # Unified recent transactions query
│   ├── auth/security.py  # JWT and password handling
│   ├── database/         # MongoDB collections and CRUD modules
│   ├── basemodel/        # Pydantic models for data validation
│   └── services/         # Business logic layer
├── frontend/             # Static HTML/JS files
│   ├── dashboard.html, js/dashboard.js
│   ├── login.html, js/login.js
│   └── [more pages...]
├── docker-compose.yml
├── nginx.conf
└── .env
```

## GraphQL API

**Endpoint:** `/graphql`

**Key Queries:**
- `me` - Current user
- `users` - All users (admin)
- `loans` - Loans with filtering
- `loan` - Single loan
- `customers` - All customers
- `savingsAccounts` - All savings
- `recentTransactions` - Unified recent transactions

**Key Mutations:**
- `login` - Authenticate
- `create_user` - Create user
- `create_loan` - Create loan application
- `create_customer` - Create customer
- `createSavingsAccount` - Create savings

**Bridge Endpoint:** `POST /api-login/` - Returns JWT token directly

## Important Notes

- Read `GEMINI.md` in the parent directory for additional context
- GraphQL mutations require valid JWT token (except introspection)
- All financial calculations use Decimal type
- MongoDB ObjectId helper: `PyObjectId` in `models.py`
- CORS allows all origins in dev - restrict in production
