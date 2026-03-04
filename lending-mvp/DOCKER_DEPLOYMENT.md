# Docker Deployment with Demo Data

## Quick Start

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## What Gets Seeded Automatically

When the backend container starts, the following demo data is automatically seeded:

### Core Data (via seed_core_pg)
- **3 Branches**: HQ, BR-QC, BR-CDO
- **8 Users**: admin, loan_officers, tellers, managers, auditor
- **10 Customers**: 8 individuals, 2 corporate
- **10 Savings Accounts**: One per customer
- **8 Loans**: Various statuses (submitted, reviewing, approved, active, paid, rejected)

### Enhanced Data (via demo_seeder_enhanced)
- **75 Customer Activity Records**: Linked to real customers with actions like:
  - created, kyc_submitted, kyc_verified
  - updated_profile, applied_for_loan
  - opened_savings_account, made_payment
  - loan_disbursed, loan_approved, etc.

- **60+ Savings Transactions**: 6 months of transaction history per account:
  - Monthly deposits
  - Withdrawals (for regular accounts)
  - Interest postings

- **60 GL Journal Entries**: Historical accounting data (12 months)

- **18 Historical Records**: Old audit logs and activities

### Collections (via migration + seeding)
- **Collection table**: Created via migration
- **Collection records**: Seeded with realistic data linked to customers with loans

## Environment Variables

The `.env` file includes:
```bash
SEED_DEMO_DATA=true  # Automatically seed demo data on startup
```

To disable demo seeding, set `SEED_DEMO_DATA=false`.

## Accessing the Application

- **Frontend**: http://localhost:3010
- **Backend GraphQL**: http://localhost:8001/graphql
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380

## Testing the Demo Data

### GraphQL Queries

```graphql
# Get customers
query {
  customers(limit: 10) {
    id
    displayName
    customerType
    branchCode
    isActive
  }
}

# Get savings accounts
query {
  savingsAccounts(limit: 10) {
    id
    accountNumber
    balance
    customerId
  }
}

# Get loans
query {
  loans(limit: 10) {
    id
    customerId
    status
    principal
  }
}

# Get customer activities
query {
  customerActivities(customerId: "1") {
    id
    activityType
    description
    createdBy
  }
}

# Get savings transactions
query {
  savingsTransactions(accountId: "1") {
    id
    type
    amount
    reference
  }
}
```

## Troubleshooting

### Demo data not appearing?

1. Check if SEED_DEMO_DATA=true in .env
2. Check backend logs: `docker-compose logs backend`
3. Look for "🌱 Seeding demo data" message

### Migration errors?

```bash
# Rebuild with migrations
docker-compose down
docker-compose up -d --build
```

### Reset all data

```bash
# Remove volumes to reset database
docker-compose down -v
docker-compose up -d --build
```
