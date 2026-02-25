# 🔑 Demo Credentials & Quick Reference

**Last Updated:** February 20, 2026

---

## All Demo Users

### Admin User
```
Username: admin
Password: Admin@123Demo
Email: admin@lending.demo
Role: Administrator
Branch: Head Office
Access: Full system access
```

### Loan Officers
```
Username: loan_officer_1
Password: LoanOfficer@123
Email: loan_officer1@lending.demo
Role: Loan Officer
Branch: Head Office
Access: Loan applications, approvals, customer management

Username: loan_officer_2
Password: LoanOfficer@123
Email: loan_officer2@lending.demo
Role: Loan Officer
Branch: Head Office
Access: Loan applications, approvals, customer management
```

### Teller
```
Username: teller_1
Password: Teller@123Demo
Email: teller@lending.demo
Role: Teller
Branch: Head Office
Access: Cash handling, deposits, withdrawals, transfers
```

### Branch Manager
```
Username: branch_manager
Password: BranchMgr@123
Email: branch_mgr@lending.demo
Role: Branch Manager
Branch: Head Office
Access: Branch reports, staff oversight, approvals
```

### Auditor
```
Username: auditor
Password: Auditor@123Demo
Email: auditor@lending.demo
Role: Auditor
Branch: Head Office
Access: Audit logs, compliance reports, activity trails
```

---

## Sample Customers

### Individual Customers

**Juan Dela Cruz**
- Email: juan.sample@example.com
- Phone: +63 900 SAMPLE 1
- Address: 123 Makati Avenue, Makati City
- Occupation: Senior Software Engineer
- Salary Range: 100,000-150,000 PHP
- Type: Individual

**Maria Cruz Santos**
- Email: maria.sample@example.com
- Phone: +63 900 SAMPLE 2
- Address: 456 Quezon Avenue, Quezon City
- Occupation: Financial Analyst
- Salary Range: 80,000-120,000 PHP
- Type: Individual

**Pedro Lopez Garcia**
- Email: pedro.sample@example.com
- Phone: +63 900 SAMPLE 3
- Address: 789 Espana Boulevard, Manila
- Occupation: Operations Manager
- Salary Range: 120,000-180,000 PHP
- Type: Individual

**Rosa Magdalo Villanueva**
- Email: rosa.sample@example.com
- Phone: +63 900 SAMPLE 4
- Address: 321 San Pedro Street, Muntinlupa
- Occupation: Freelance Consultant
- Salary Range: 50,000-100,000 PHP
- Type: Individual

### Joint Account
- **Name:** Dela Cruz - Santos Joint Account
- **Email:** joint.sample@example.com
- **Phone:** +63 900 SAMPLE 5
- **Address:** 500 Rizal Avenue, Makati City
- **Type:** Joint

### Corporate Customers

**TechCorp Philippines Inc.**
- Address: 10th Floor, BGC Plaza, BGC, Taguig
- Email: corp1@example.com
- Phone: +63 2 1234 0001
- TIN: 001-234-567-000
- Type: Corporate

**Manufacturing Industries Ltd.**
- Address: Laguna Technopark, Sta. Rosa, Laguna
- Email: corp2@example.com
- Phone: +63 49 5678 0001
- TIN: 002-345-678-000
- Type: Corporate

---

## Sample Loan Products

### 1. Personal Loan
- Rate: 12-18% annually
- Term: 6-60 months
- Min Amount: PHP 50,000
- Max Amount: PHP 500,000
- Amortization: Declining Balance
- Prepayment: Allowed (0% penalty)
- Origination Fee: 2%

### 2. Home Loan
- Rate: 6-9% annually
- Term: 60-240 months (5-20 years)
- Min Amount: PHP 500,000
- Max Amount: PHP 5,000,000
- Amortization: Amortized
- Grace Period: 6 months
- Prepayment: Allowed (0.5% penalty)
- Origination Fee: 1.5%

### 3. Agricultural Loan
- Rate: 10-14% annually
- Term: 6-12 months
- Min Amount: PHP 100,000
- Max Amount: PHP 1,000,000
- Amortization: Balloon Payment
- Prepayment: Not allowed (2% penalty)
- Origination Fee: 1%

### 4. Business Loan
- Rate: 12-16% annually
- Term: 12-60 months
- Min Amount: PHP 250,000
- Max Amount: PHP 5,000,000
- Amortization: Amortized
- Grace Period: 3 months
- Prepayment: Allowed (0% penalty)
- Origination Fee: 2%

---

## Quick GraphQL Queries

### 1. Get All Customers
```graphql
query {
  customers(skip: 0, limit: 100) {
    success
    total
    customers {
      id
      displayName
      email
      mobile_number
      customer_type
    }
  }
}
```

### 2. Get All Loans
```graphql
query {
  loans(skip: 0, limit: 100) {
    success
    total
    loans {
      id
      customer_id
      principal
      term_months
      status
      approved_rate
      created_at
    }
  }
}
```

### 3. Get Savings Accounts
```graphql
query {
  savingsAccounts(skip: 0, limit: 100) {
    success
    total
    accounts {
      id
      account_number
      balance
      type
      customer_id
    }
  }
}
```

### 4. Get Audit Logs
```graphql
query {
  auditLogs(skip: 0, limit: 100) {
    success
    total
    logs {
      id
      user_id
      action
      entity
      status
      created_at
    }
  }
}
```

---

## REST Endpoints (Examples)

### Authentication
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123Demo"
}
```

### Get Customers
```bash
GET /api/customers?skip=0&limit=100
Authorization: Bearer <token>
```

### Get Loans
```bash
GET /api/loans?skip=0&limit=100
Authorization: Bearer <token>
```

### Create New Customer
```bash
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_type": "individual",
  "first_name": "Test",
  "last_name": "User",
  "display_name": "Test User",
  "email_address": "test@example.com",
  "mobile_number": "+63 900 TEST 0000",
  "branch": "HQ"
}
```

---

## Branches

### Head Office (HQ)
- Address: 1500 Makati Avenue, Makati City
- Contact: +63 2 1234 5678
- Code: HQ

### Quezon City Branch (BR-QC)
- Address: 500 Pioneer Street, Mandaluyong
- Contact: +63 2 8765 4321
- Code: BR-QC

### Cagayan de Oro Branch (BR-CDO)
- Address: 123 Osmeña Boulevard, Cagayan de Oro
- Contact: +63 88 123 4567
- Code: BR-CDO

---

## Sample Loan Scenarios

### Scenario 1: Personal Loan (Pending)
```
Customer: Juan Dela Cruz
Product: Personal Loan
Amount: PHP 150,000
Term: 24 months
Status: Pending Review
Created: 20 days ago
Test Flow: Review → Approve → Disburse → Repay
```

### Scenario 2: Home Loan (Approved)
```
Customer: Maria Cruz Santos
Product: Home Loan
Amount: PHP 1,500,000
Term: 120 months (10 years)
Status: Approved
Created: 10 days ago
Test Flow: View application → See approval → Prepare disbursement
```

### Scenario 3: Business Loan (Active)
```
Customer: Pedro Lopez Garcia
Product: Business Loan
Amount: PHP 500,000
Term: 48 months
Status: Active (Disbursed)
Created: 30 days ago
Test Flow: View amortization → Record payments → Check balance
```

### Scenario 4: Agricultural Loan (Pending)
```
Customer: Rosa Villanueva
Product: Agricultural Loan
Amount: PHP 300,000
Term: 12 months
Status: Pending
Created: 5 days ago
Test Flow: Collateral assessment → Approval → Seasonal disbursement
```

---

## Sample Savings Accounts

### Regular Savings Accounts
- 7 accounts (one per customer)
- Balance: PHP 50,000 - 150,000
- Interest Rate: 0.25% - 3.5% annually
- Minimum Balance: PHP 500
- Features: Deposits, withdrawals, transfers, interest accrual

### Time Deposit Accounts
- 2-3 accounts per customer
- Principal: PHP 100,000 - 500,000
- Term: 12 months
- Interest Rate: 5.5% annually
- Features: Fixed term, maturity notification, auto-renewal option

### Goal Savings Accounts
- 1-2 accounts per customer
- Target Amount: PHP 500,000
- Current Savings: PHP 200,000-300,000
- Target Date: 1 year from now
- Features: Progress tracking, target-based savings

### Share Capital Accounts
- 1 account per corporate customer
- Minimum Share: PHP 100
- Share Value: PHP 100
- Total Shares: 100-1,000
- Features: Membership-tied, restricted withdrawals

---

## Testing Workflows

### Test 1: Complete Loan Approval Process
1. Login as `loan_officer_1`
2. Query pending loans (should see Personal Loan)
3. Get loan details
4. Create approval
5. Trigger disbursement
6. Verify in customer's savings

### Test 2: Savings Account Operations
1. Login as `teller_1`
2. Find customer's savings account
3. Record deposit
4. Record withdrawal
5. Check interest posting
6. Print statement

### Test 3: Audit Trail
1. Login as `auditor`
2. View audit logs (50+ entries)
3. Filter by action
4. Filter by entity
5. Review customer activity timeline
6. Verify KYC document status

### Test 4: Collections Management
1. Login as `branch_manager`
2. View aging buckets
3. Identify overdue loans
4. Record promise-to-pay
5. Follow up on collection
6. View report summary

---

## Environment Setup

### Docker Compose
```bash
cd lending-mvp
export SEED_DEMO_DATA=true
docker-compose up -d --build
```

### Access Points
- GraphQL: http://localhost:8080/graphql
- API: http://localhost:8000
- Frontend: http://localhost:3000 (if running)
- MongoDB: localhost:27017
- PostgreSQL: localhost:5432

### Enable/Disable Demo Data
```bash
# Enable
export SEED_DEMO_DATA=true

# Disable
export SEED_DEMO_DATA=false

# Verify
echo $SEED_DEMO_DATA
```

---

## Quick Troubleshooting

### "Invalid credentials"
- ✓ Copy password exactly as shown above
- ✓ Check username case (lowercase)
- ✓ Verify SEED_DEMO_DATA=true was set before docker startup

### "No customers found"
- ✓ Restart with SEED_DEMO_DATA=true
- ✓ Check docker logs: `docker-compose logs backend`
- ✓ Reset DB: `docker-compose down -v && docker-compose up -d --build`

### "Database connection error"
- ✓ Verify containers running: `docker-compose ps`
- ✓ Check network: `docker network ls`
- ✓ Restart: `docker-compose restart`

---

## Remember

✅ All demo users use password format: `Word@123Demo` or `Role@123`  
✅ Email domain: `@lending.demo` for users, `@example.com` for customers  
✅ All phone numbers are sample format: `+63 900 SAMPLE #`  
✅ Never use these credentials in production!  
✅ Seeding is idempotent (won't create duplicates)  

---

**Save this document for quick reference! 🚀**
