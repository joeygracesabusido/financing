# Demo Data Seeder Setup & Usage Guide

## Overview

The demo data seeder populates your Lending & Savings Management System with realistic sample data across all completed Phase 1-3 features:

- ✅ Users (6 roles: Admin, Loan Officers, Teller, Branch Manager, Auditor)
- ✅ Branches (3 locations)
- ✅ Customers (Individual, Joint, Corporate)
- ✅ Loan Products (Personal, Home, Agricultural, Business)
- ✅ Loans (Various workflow states)
- ✅ Savings Accounts (6 types)
- ✅ KYC Documents
- ✅ Beneficiaries
- ✅ Customer Activities
- ✅ Audit Logs

---

## Quick Start

### Method 1: Enable via Environment Variable (Recommended)

1. **Set environment variable before starting the backend:**

```bash
export SEED_DEMO_DATA=true
cd lending-mvp/backend
python -m uvicorn app.main:app --reload
```

2. **Or add to `.env` file:**

```env
SEED_DEMO_DATA=true
```

3. **The seeder will run automatically on startup** and log all created records.

### Method 2: Manual Python Script

```python
import asyncio
from app.utils.demo_seeder import seed_demo_data

async def main():
    results = await seed_demo_data()
    print(results)

asyncio.run(main())
```

### Method 3: Direct Script Execution

```bash
cd lending-mvp/backend
python -m app.utils.demo_seeder
```

---

## Demo Data Provided

### Users (6 Records)

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | Admin@123Demo | admin | admin@lending.demo |
| loan_officer_1 | LoanOfficer@123 | loan_officer | loan_officer1@lending.demo |
| loan_officer_2 | LoanOfficer@123 | loan_officer | loan_officer2@lending.demo |
| teller_1 | Teller@123Demo | teller | teller1@lending.demo |
| branch_manager | BranchMgr@123 | branch_manager | branch_manager@lending.demo |
| auditor | Auditor@123Demo | auditor | auditor@lending.demo |

**Testing Tip:** Use these credentials to log in and explore the system with different roles.

### Branches (3 Records)

```
HQ - Head Office (Makati)
BR-QC - Quezon City Branch
BR-CDO - Cagayan de Oro Branch
```

### Customers (9 Records)

**Individuals:** 4 customers with varied employment (Software Engineer, Analyst, Manager, Freelancer)  
**Joint:** 1 joint account scenario  
**Corporate:** 2 business customers

### Loan Products (4 Records)

| Product | Type | Min Amount | Max Amount | Term |
|---------|------|-----------|-----------|------|
| Personal Loan | Unsecured | 50k | 500k | 6-60 months |
| Home Loan | Secured | 500k | 5M | 60-240 months |
| Agricultural Loan | Semi-secured | 100k | 1M | 6-12 months |
| Business Loan | Semi-secured | 250k | 5M | 12-60 months |

### Loans (4 Records)

Across workflow states:
- 1 Pending Application
- 1 Approved Loan
- 2 Active Loans with ongoing repayments

### Savings Accounts (16 Records)

- **Regular Savings:** 4 accounts
- **Time Deposits:** 4 accounts (365-day terms)
- **Goal Savings:** 4 accounts (56% progress to target)
- **Share Capital:** 4 accounts (cooperative membership)

### KYC Documents (6 Records)

- Government ID (verified)
- Proof of Address (verified)
- For first 3 customers

### Beneficiaries (12 Records)

- 3 per customer (Spouse, Child, Parent)
- Contact information included

### Customer Activities (36 Records)

- 6 activities per customer: created, kyc_submitted, kyc_verified, etc.
- Timestamped with realistic timeline

### Audit Logs (18 Records)

- Actions: create_customer, approve_loan, disburse_loan, deposit_cash, etc.
- Track user, IP, timestamp, action details

---

## Seeding Output Example

```
======================================================================
STARTING DEMO DATA SEEDING
======================================================================
Seeding branches...
Branches seeded: 3 new records
Seeding users...
  ✓ Created user: admin (admin)
  ✓ Created user: loan_officer_1 (loan_officer)
  ✓ Created user: loan_officer_2 (loan_officer)
  ✓ Created user: teller_1 (teller)
  ✓ Created user: branch_manager (branch_manager)
  ✓ Created user: auditor (auditor)
Users seeded: 6 new records
Seeding customers...
  ✓ Created customer: Juan dela Cruz
  ✓ Created customer: Maria Cruz Santos
  ✓ Created customer: Pedro Lopez Garcia
  ✓ Created customer: Rosa Magdalo Villanueva
  ✓ Created customer: Dela Cruz - Santos Joint Account
  ✓ Created customer: TechCorp Philippines Inc.
  ✓ Created customer: Manufacturing Industries Ltd.
Customers seeded: 7 new records
Seeding loan products...
  ✓ Created product: Personal Loan
  ✓ Created product: Home Loan
  ✓ Created product: Agricultural Loan
  ✓ Created product: Business Loan
Loan products seeded: 4 new records
Seeding loans...
  ✓ Created loan: LOAN-000001 (pending)
  ✓ Created loan: LOAN-000002 (approved)
  ✓ Created loan: LOAN-000003 (active)
  ✓ Created loan: LOAN-000004 (active)
Loans seeded: 4 new records
Seeding savings accounts...
  ✓ Created savings: SAVE-1001 (regular)
  ✓ Created savings: TDEP-1002 (time_deposit)
  ✓ Created savings: GOAL-1003 (goal_savings)
  ✓ Created savings: SHAR-1004 (share_capital)
  ... [12 more savings accounts]
Savings accounts seeded: 16 new records
Seeding KYC documents...
KYC documents seeded: 6 new records
Seeding beneficiaries...
Beneficiaries seeded: 12 new records
Seeding customer activities...
Customer activities seeded: 36 new records
Seeding audit logs...
Audit logs seeded: 18 new records
======================================================================
DEMO DATA SEEDING COMPLETE ✅
======================================================================

Summary:
  branches: 3 records
  users: 6 records
  customers: 7 records
  loan_products: 4 records
  loans: 4 records
  savings: 16 new records
  kyc_documents: 6 records
  beneficiaries: 12 records
  customer_activities: 36 records
  audit_logs: 18 records
```

---

## Docker Compose Usage

### Enable Demo Data in Docker

Add environment variable to `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - SEED_DEMO_DATA=true
      - DATABASE_URL=postgresql://user:password@postgres:5432/lending
      - MONGODB_URI=mongodb://mongo:27017/lending
```

Then rebuild and restart:

```bash
docker-compose down
docker-compose up --build
```

Watch logs:
```bash
docker-compose logs -f backend
```

---

## Key Features & Design

### ✅ Smart Seeding

- **Idempotent:** Won't create duplicates on repeated runs
- **Linked References:** Customers linked to loans, loans to products, etc.
- **Realistic Data:** Uses local names, phone numbers, addresses
- **Time-Stamped:** Activities and transactions have realistic timelines
- **Compliant:** Uses sample/demo patterns (email: *.demo, phone: SAMPLE tokens)

### 🔒 Data Integrity

- **Decimal Precision:** Monetary values use Decimal type
- **Timezone-Aware:** All timestamps in UTC
- **ObjectId Usage:** Proper MongoDB ObjectId handling
- **FK Relationships:** Cross-DB references (MongoDB → PostgreSQL)

### 📊 Exploration Scenarios

**As Admin:**
- View all users and branches
- Access audit logs
- Monitor system-wide activities

**As Loan Officer:**
- See pending applications
- View approved loans
- Track customer KYC status

**As Teller:**
- Process transactions (existing savings)
- View customer account balances
- Generate receipts

**As Customer (via Demo Portal):**
- View personal loan status
- Check savings balances
- Download statements

---

## Demo Data Content Standards

### Names & Contact Info

```
Format: Local names (Juan, Maria, Pedro, Rosa)
Email: {name}.sample@example.com
Phone: +63 900 SAMPLE {N}
TIN/SSS: Sample format (123-456-789-000)
```

### Financial Amounts

```
Personal Loans: 50k - 500k PHP
Home Loans: 500k - 5M PHP
Business Loans: 250k - 5M PHP
Savings: 50k - 200k PHP
Interest Rates: 0.25% - 18% annually
```

### Addresses

```
Primary: Makati, Quezon City, Metro Manila
Secondary: Laguna, Cagayan de Oro
Format: Street # + Area, City
```

---

## Troubleshooting

### Issue: "Demo data already seeded"

**Solution:** The seeder is idempotent. It checks for existing records before creating.  
To reset: Clear MongoDB and PostgreSQL collections/tables before re-seeding.

### Issue: "SEED_DEMO_DATA environment variable not recognized"

**Solution:** Ensure it's set before the app starts:

```bash
# Linux/Mac
export SEED_DEMO_DATA=true
python -m uvicorn app.main:app

# Windows (PowerShell)
$env:SEED_DEMO_DATA="true"
python -m uvicorn app.main:app

# Windows (CMD)
set SEED_DEMO_DATA=true
python -m uvicorn app.main:app
```

### Issue: "Cannot connect to MongoDB/PostgreSQL"

**Solution:** Ensure both databases are running and connection strings are correct in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/lending
DATABASE_URL=postgresql://user:password@localhost:5432/lending
```

### Issue: Password hashing error

**Solution:** Passwords are automatically truncated to 72 bytes before hashing (bcrypt limit).  
If you see "password cannot be longer than 72 bytes", clear your passwords file and re-seed.

---

## Next Steps

1. **After Seeding:**
   - Login with demo credentials
   - Explore the GraphQL playground at `/graphql`
   - View dashboards in the React frontend
   - Test workflows with sample data

2. **Customization:**
   - Edit `SAMPLE_*` constants to modify demo data
   - Add more customers/loans/accounts
   - Modify product parameters

3. **Production Prep:**
   - Set `SEED_DEMO_DATA=false` before production deployment
   - Use real data migration scripts for production onboarding
   - Keep demo seeder for development/testing environments

---

## File Locations

| File | Purpose |
|------|---------|
| `lending-mvp/backend/app/utils/demo_seeder.py` | Main seeder script |
| `lending-mvp/backend/app/main.py` | Integration point (lifespan) |
| `.env` | Configuration (SEED_DEMO_DATA=true) |
| `docker-compose.yml` | Docker environment setup |

---

## Support & Documentation

- **API Docs:** `http://localhost:8000/docs`
- **GraphQL Playground:** `http://localhost:8000/graphql`
- **Analysis Document:** See `DEMO_DATA_ANALYSIS.md`
- **Roadmap:** See `ROADMAP.md`

---

*Demo Seeder Setup Guide — Last Updated: February 20, 2026*
