# 🌱 Demo Data Seeder — Quick Reference

## TL;DR

```bash
# Enable demo data seeding
export SEED_DEMO_DATA=true

# Start the backend
cd lending-mvp/backend
python -m uvicorn app.main:app --reload

# Backend will automatically seed sample data on startup ✨
```

---

## Demo Credentials

| Role | Username | Password | Use Case |
|------|----------|----------|----------|
| 🔐 **Admin** | `admin` | `Admin@123Demo` | System admin, audit logs, user management |
| 💼 **Loan Officer** | `loan_officer_1` | `LoanOfficer@123` | Create loans, process applications |
| 💳 **Teller** | `teller_1` | `Teller@123Demo` | Deposit/withdrawal, cash transactions |
| 👔 **Branch Manager** | `branch_manager` | `BranchMgr@123` | Approve loans, branch oversight |
| 👁️ **Auditor** | `auditor` | `Auditor@123Demo` | View audit logs, compliance checks |

---

## What Gets Seeded?

### Users (6)
All demo roles with different permissions

### Branches (3)
- HQ (Makati)
- QC Branch (Mandaluyong)
- CDO Branch (Cagayan de Oro)

### Customers (7)
- 4 Individuals (engineers, analysts, managers)
- 1 Joint Account
- 2 Corporate Businesses

### Loan Products (4)
| Product | Min | Max | Term |
|---------|-----|-----|------|
| Personal | 50k | 500k | 6-60mo |
| Home | 500k | 5M | 60-240mo |
| Agricultural | 100k | 1M | 6-12mo |
| Business | 250k | 5M | 12-60mo |

### Loans (4)
- Pending applications
- Approved loans
- Active loans with payments

### Savings Accounts (16)
- Regular savings (4)
- Time deposits (4)
- Goal savings (4)
- Share capital (4)

### Relationships
- KYC documents (6)
- Beneficiaries (12)
- Customer activities (36)
- Audit logs (18)

---

## Quick Start Scenarios

### Scenario 1: Test Loan Workflow
1. Login as `loan_officer_1`
2. View the 1 pending loan application
3. Create a new loan for customer "Juan dela Cruz"
4. Approve and disburse the loan

### Scenario 2: Check Savings
1. Login as `admin`
2. View customer "Maria Cruz Santos" account
3. Check her 4 savings accounts (Regular, Time Deposit, Goal, Share Capital)
4. View interest accruals

### Scenario 3: Collections Management
1. Login as `loan_officer_1`
2. View the 2 active loans
3. See payment schedule and aging buckets
4. Create payment records (demo only)

### Scenario 4: Audit Trail
1. Login as `auditor`
2. View audit logs showing all actions
3. Filter by user, date, action type
4. Export for compliance reporting

---

## Where to Find Seeded Data

### GraphQL Queries

```graphql
# Get all customers
query {
  getAllCustomers {
    id
    displayName
    customerType
    email
  }
}

# Get all loans
query {
  getLoans {
    id
    loanId
    borrowerId
    status
    amountRequested
    termMonths
  }
}

# Get savings accounts
query {
  getAllSavingsAccounts {
    id
    accountNumber
    type
    balance
    status
  }
}
```

### REST Endpoints

```bash
# Get all users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/users

# Get branches
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/branches

# Get audit logs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/audit-logs
```

### Frontend Dashboards

- Dashboard: Shows overview of all accounts, loans, savings
- Customers: Browse all 7 demo customers
- Loans: View 4 loans across workflow states
- Savings: Check 16 savings accounts with balances
- Audit: See all 18+ system actions logged

---

## Environment Variables

### Enable Seeding

```bash
# Enable demo data
export SEED_DEMO_DATA=true

# Disable demo data (recommended for production)
export SEED_DEMO_DATA=false
```

### Database Connection

```bash
export MONGODB_URI=mongodb://localhost:27017/lending
export DATABASE_URL=postgresql://user:pass@localhost:5432/lending_db
```

### .env File

```env
SEED_DEMO_DATA=true
MONGODB_URI=mongodb://localhost:27017/lending
DATABASE_URL=postgresql://lending_user:lending_password@localhost:5432/lending_db
```

---

## Docker Quick Start

```bash
# Using docker-compose with demo data
cd lending-mvp
docker-compose -f docker-compose.demo.yml up --build

# Check logs
docker-compose -f docker-compose.demo.yml logs -f backend

# Stop services
docker-compose -f docker-compose.demo.yml down
```

### Access Points

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| GraphQL | http://localhost:8000/graphql |
| Docs | http://localhost:8000/docs |
| Frontend | http://localhost:5173 |
| Nginx | http://localhost:8080 |

---

## Common Tasks with Demo Data

### Reset Demo Data
```bash
# Stop services
docker-compose down -v

# Start fresh with new demo data
docker-compose up --build
```

### Customize Demo Data
Edit `lending-mvp/backend/app/utils/demo_seeder.py`:

```python
# Modify sample customers
SAMPLE_CUSTOMERS_INDIVIDUAL = [
    {
        "first_name": "Your",
        "last_name": "Name",
        ...
    }
]

# Change loan product amounts
SAMPLE_LOAN_PRODUCTS = [
    {
        "product_name": "Custom Loan",
        "min_amount": 100000,  # Change here
        ...
    }
]
```

### Add More Demo Data
```python
# In demo_seeder.py, expand SAMPLE_CUSTOMERS, SAMPLE_LOANS, etc.

# Then seed with:
export SEED_DEMO_DATA=true
```

---

## Testing Checklist

- [ ] Login with admin credentials
- [ ] View all 7 customers in customer list
- [ ] Create new customer (requires loan officer role)
- [ ] Apply for loan using demo customer
- [ ] View 4 loan products
- [ ] Check 16 savings accounts
- [ ] View customer KYC documents (6)
- [ ] Check beneficiaries (12 total)
- [ ] Review audit logs (18 entries)
- [ ] Export statement/report
- [ ] Test permission restrictions per role

---

## Troubleshooting

### No demo data showing up

```bash
# Check if SEED_DEMO_DATA is set
echo $SEED_DEMO_DATA

# Re-enable and restart
export SEED_DEMO_DATA=true
python -m uvicorn app.main:app --reload
```

### Duplicate records being created

```bash
# The seeder is idempotent and won't create duplicates
# If you see duplicates, clear the database and reseed:
# (see Reset Demo Data section)
```

### Database connection errors

```bash
# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Verify PostgreSQL is running
psql -U lending_user -d lending_db -c "SELECT 1"
```

---

## Demo Data Security Notes

⚠️ **Important:**
- Demo data uses **SAMPLE** and **TEST** patterns for PII
- Never use real customer information in demo data
- Always set `SEED_DEMO_DATA=false` in production
- Demo credentials are for development only
- Use strong passwords in production

✅ **Safe to:**
- Use demo data in development
- Share demo credentials with team members
- Test features against demo data
- Export demo data for testing/training

---

## Next Steps

1. **Explore:** Login and browse the system
2. **Test:** Try different user roles
3. **Customize:** Modify demo data for your needs
4. **Deploy:** Set `SEED_DEMO_DATA=false` for production
5. **Learn:** Study `DEMO_DATA_ANALYSIS.md` for details

---

## Documentation

- **Full Setup:** `DEMO_DATA_SETUP_GUIDE.md`
- **Analysis:** `DEMO_DATA_ANALYSIS.md`
- **API Docs:** `http://localhost:8000/docs`
- **Roadmap:** `ROADMAP.md`

---

*Last Updated: February 20, 2026*
