# Demo Data Generation Analysis — ROADMAP.md Completed Tasks

**Date:** February 20, 2026  
**Purpose:** Assess which completed tasks are suitable for demo data generation to enhance user exploration

---

## Executive Summary

✅ **Recommendation:** YES — Most completed tasks are **excellent candidates for demo data generation**.

Generating realistic demo data for the completed features will significantly improve user onboarding and feature exploration. Below is a detailed analysis of each completed task with recommendations on data requirements.

---

## Phase 1: Foundation & Core Banking — Demo Data Assessment

### ✅ 1.1 Infrastructure
- **PostgreSQL Migration** → **Suitable for demo data**
  - Demo: Pre-populate with ~50-100 sample records across all core tables
  - Benefit: Users see relational data integrity immediately
  
- **Alembic Migrations** → **No data needed**
  - Already handled by migration system
  
- **Redis** → **Suitable for demo data**
  - Demo: Pre-seed session cache, rate-limiting counters
  
- **React Frontend** → **Highly suitable for demo data**
  - Demo: Display rich sample dashboards, charts with real customer/loan data
  
- **Background Task Queue** → **Suitable for demo data**
  - Demo: Show scheduled interest calculation jobs, statement generation logs

---

### ✅ 1.2 User & Role Management
**Priority for demo data: HIGH** ⭐⭐⭐

Generate realistic demo users for each role:

```
| Role | Demo Users | Demo Data |
|------|-----------|-----------|
| Admin | 1 | Full system access, audit logs |
| Loan Officer | 2-3 | Loan applications assigned, history |
| Teller | 2 | Daily transaction records, till balancing |
| Branch Manager | 1 | Multi-branch reports, oversight logs |
| Auditor | 1 | Full audit trail access |
| Customer (Individual) | 20-30 | Active savings & loan accounts |
| Customer (Joint) | 5-10 | Joint account with co-owners |
| Customer (Corporate) | 3-5 | Business loan profiles |
```

**Sample Data Requirements:**
- [ ] Branch locations (HQ, Branch A, Branch B)
- [ ] User login credentials with 2FA demo
- [ ] Session records with IP/timestamp
- [ ] Password change history
- [ ] Concurrent session logs

---

### ✅ 1.3 Customer (Member) Management
**Priority for demo data: CRITICAL** ⭐⭐⭐⭐

Generate comprehensive customer profiles:

```
Customer Demo Profile Example:
├── Personal Information
│   ├── Name: Juan dela Cruz
│   ├── Email: juan@example.com
│   ├── Phone: +63 917 123 4567
│   ├── Address: 123 Makati Ave, Manila
│   └── ID/Reference: CUST-001
├── KYC Documents
│   ├── Government ID (✅ Verified)
│   ├── Proof of Address (✅ Verified)
│   ├── Risk Profile: Low (Score: 85/100)
│   └── Verification Timestamp: 2026-02-01
├── Category: Individual
├── Beneficiaries: 2
│   ├── Spouse (Maria dela Cruz)
│   └── Child (Jose dela Cruz Jr.)
└── Activity Timeline: 45 transactions (6 months)
```

**Sample Data Requirements:**
- [ ] 25-50 customer records with varied demographics
- [ ] KYC documents (marked as verified/rejected/pending)
- [ ] Risk profiles computed from KYC data
- [ ] Duplicate detection demo (flag similar names)
- [ ] Customer activity logs spanning 6 months
- [ ] Joint account scenarios (2-3 customers)
- [ ] Corporate customer profiles

---

## Phase 2: Loan Lifecycle Management — Demo Data Assessment

### ✅ 2.1 Loan Products (Enhanced)
**Priority for demo data: CRITICAL** ⭐⭐⭐⭐

Generate diverse loan products:

```
Demo Loan Products:
1. Personal Loan (Declining Balance)
   - Amount Range: PHP 50,000 - 500,000
   - Term: 12-60 months
   - Rate: 12-18% annually
   - Repayment: Monthly
   - Grace Period: 0 months

2. Home Loan (Amortized)
   - Amount Range: PHP 500,000 - 2,000,000
   - Term: 120-240 months
   - Rate: 6-9% annually
   - Repayment: Monthly
   - Grace Period: 6 months principal-only

3. Agricultural Loan (Balloon)
   - Amount Range: PHP 100,000 - 1,000,000
   - Term: 12 months
   - Rate: 10% annually
   - Repayment: Monthly
   - Balloon: 40% of principal at end

4. Business Loan (Interest-Only + Principal)
   - Amount Range: PHP 250,000 - 5,000,000
   - Term: 24-60 months
   - Rate: 14-16% annually
   - Prepayment: Allowed (no penalty)
```

**Sample Data Requirements:**
- [ ] 4-6 loan product definitions
- [ ] Penalty/late fee configurations per product
- [ ] Origination fee examples (flat + percentage)
- [ ] Prepayment rules (allowed, restricted, with/without penalty)
- [ ] Borrowing limits per customer
- [ ] Grace period scenarios

---

### ✅ 2.2 Loan Application & Approval
**Priority for demo data: CRITICAL** ⭐⭐⭐⭐

Generate complete loan application workflows:

```
Demo Loan Applications (States):
├── Pending Application (5 records)
│   ├── Submitted: 2026-02-15
│   ├── Documents: Payslip, ITR, COE ✅
│   ├── Credit Score: Calculating...
│   └── Status: Awaiting Loan Officer Review
├── Under Review (3 records)
│   ├── Loan Officer Assessment: In Progress
│   ├── 5Cs Score: Character (Good), Capacity (Good), Capital (Fair)
│   └── DTI Ratio: 32% (PASS - below 40% threshold)
├── Approved (15 records)
│   ├── Approved By: Branch Manager + Credit Committee
│   ├── Approval Date: 2026-02-01
│   ├── Conditions: Collateral registration required
│   └── Valid Until: 2026-05-01
└── Rejected (2 records)
    ├── Reason: DTI ratio exceeded (58%)
    └── Appeal Option: Available
```

**Sample Data Requirements:**
- [ ] 30-50 loan applications across all workflow stages
- [ ] Collateral registrations (land, vehicle, jewelry)
- [ ] Co-maker/guarantor profiles linked to applications
- [ ] Multi-stage approval workflow records
- [ ] Credit scoring results (5Cs breakdown)
- [ ] DTI calculations with detailed breakdown
- [ ] Document attachments (payslips, ITR, COE)
- [ ] Loan calculator output examples

---

### ✅ 2.3 Loan Disbursement
**Priority for demo data: HIGH** ⭐⭐⭐

Generate disbursement transactions:

```
Demo Disbursements:
├── Full Disbursement (10 records)
│   ├── Loan: PHP 200,000
│   ├── Method: Transfer to Savings Account
│   ├── Date: 2026-02-10
│   └── Status: Completed
├── Partial Disbursement - Tranches (5 records)
│   ├── Loan: PHP 500,000 (Construction)
│   ├── Tranche 1: PHP 200,000 (Foundation) → Completed
│   ├── Tranche 2: PHP 200,000 (Structure) → Pending
│   ├── Tranche 3: PHP 100,000 (Finishing) → Pending
│   └── Disbursement Checklist: 8/10 items ✅
└── Multiple Methods (3 records)
    ├── Cash Disbursement: PHP 50,000
    ├── Check Disbursement: PHP 75,000
    └── Mobile Money Disbursement: PHP 25,000
```

**Sample Data Requirements:**
- [ ] 20-30 completed disbursement records
- [ ] 5-10 partial disbursements (tranches) for construction loans
- [ ] Pre-disbursement checklist items (verified/pending)
- [ ] Multiple disbursement methods (cash, check, transfer, mobile money)

---

### ✅ 2.4 Loan Repayment & Collections
**Priority for demo data: CRITICAL** ⭐⭐⭐⭐⭐

Generate comprehensive repayment scenarios:

```
Demo Amortization Schedule (36-month Personal Loan: PHP 100,000 @ 12%):
┌─────┬──────────────┬──────────┬──────────┬──────────┬──────────────┐
│ #   │ Due Date     │ Principal│ Interest │ Penalty  │ Total Due    │
├─────┼──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ 1   │ 2026-03-15   │ 2,565    │ 1,000    │ 0        │ 3,565 (PAID) │
│ 2   │ 2026-04-15   │ 2,587    │ 978      │ 0        │ 3,565 (PAID) │
│ 3   │ 2026-05-15   │ 2,610    │ 955      │ 0        │ 3,565 (PAID) │
│ ... │ ...          │ ...      │ ...      │ ...      │ ...          │
│ 35  │ 2029-02-15   │ 3,492    │ 73       │ 0        │ 3,565 (PAID) │
│ 36  │ 2029-03-15   │ 3,518    │ 47       │ 0        │ 3,565 (PAID) │
└─────┴──────────────┴──────────┴──────────┴──────────┴──────────────┘

Collections Dashboard (Aging Buckets):
├── Current (0 DPD): 35 loans, PHP 2,500,000
├── 1-30 DPD: 5 loans, PHP 180,000
├── 31-60 DPD: 3 loans, PHP 120,000
├── 61-90 DPD: 2 loans, PHP 95,000
└── 90+ DPD: 2 loans, PHP 85,000 (PTP Tracking Active)
```

**Sample Data Requirements:**
- [ ] 20-30 complete amortization schedules across products
- [ ] 15-20 fully paid loans (100% collected)
- [ ] 5-10 loans in various stages of repayment
- [ ] Overpayment examples (credited to next period or savings)
- [ ] 3-5 restructured/refinanced loans
- [ ] 2-3 written-off loans (with approval trail)
- [ ] Collections aging bucket distributions
- [ ] Promise-to-Pay (PTP) tracking records
- [ ] Official Receipts (OR) for each payment
- [ ] Waterfall logic examples (principal vs. interest vs. penalty)

---

### ✅ 2.5 Loan Accounting (Double-Entry)
**Priority for demo data: HIGH** ⭐⭐⭐

Generate GL entries and journal records:

```
Demo General Ledger Transactions:
Date: 2026-02-10
Transaction: Loan Disbursement (PHP 100,000)
┌──────────────────────────────────┬──────────┬──────────┐
│ Account                          │ Debit    │ Credit   │
├──────────────────────────────────┼──────────┼──────────┤
│ 1010 Loans Receivable            │100,000   │          │
│ 1020 Cash at Bank                │          │100,000   │
├──────────────────────────────────┼──────────┼──────────┤
│ Totals                           │100,000   │100,000   │
└──────────────────────────────────┴──────────┴──────────┘

Date: 2026-02-28
Transaction: Interest Accrual (Daily accrual)
┌──────────────────────────────────┬──────────┬──────────┐
│ Account                          │ Debit    │ Credit   │
├──────────────────────────────────┼──────────┼──────────┤
│ 1015 Interest Receivable         │1,000     │          │
│ 4100 Interest Income             │          │1,000     │
└──────────────────────────────────┴──────────┴──────────┘

Provision for Loan Loss (Monthly):
Portfolio @ Risk (PAR > 30 days): PHP 295,000
Provision Rate: 25%
Provision Entry: Dr. 5100 Loan Loss Provision Expense 73,750
                 Cr. 1050 Allowance for Doubtful Accounts 73,750
```

**Sample Data Requirements:**
- [ ] 50-100 GL journal entries spanning 6 months
- [ ] Double-entry verification (all entries balanced)
- [ ] Interest accrual entries (daily/monthly examples)
- [ ] Loan disbursement entries
- [ ] Repayment entries (principal + interest split)
- [ ] Penalty posting entries
- [ ] Provision for loan losses based on PAR aging
- [ ] Month-end closing entries

---

## Phase 3: Savings & Deposit Products — Demo Data Assessment

### ✅ 3.1 Savings Account Types
**Priority for demo data: CRITICAL** ⭐⭐⭐⭐

Generate diverse savings account scenarios:

```
Demo Savings Accounts:
1. Regular Passbook (10 accounts)
   ├── Sample Customer: Maria Santos
   ├── Current Balance: PHP 45,300
   ├── Opening Date: 2025-01-15
   ├── Last Transaction: 2026-02-18
   ├── Monthly Interest: PHP 150-300
   └── Transactions: 50+ entries

2. Time Deposit (5 accounts)
   ├── Amount: PHP 100,000
   ├── Term: 12 months
   ├── Rate: 5.5% annually
   ├── Maturity Date: 2026-12-15
   ├── Status: Active (5 months remaining)
   └── Auto-renewal: Enabled

3. Share Capital (8 accounts)
   ├── Member: Cooperative member
   ├── Balance: PHP 10,000 (mandatory share)
   ├── Purpose: Membership equity
   └── Restrictions: Cannot withdraw without membership termination

4. Goal Savings (4 accounts)
   ├── Goal: "House Renovation"
   ├── Target Amount: PHP 500,000
   ├── Current: PHP 280,000 (56% complete)
   ├── Target Date: 2027-12-31
   ├── Monthly Contribution: PHP 20,000
   └── Months Remaining: 11

5. Minor's Account (3 accounts)
   ├── Minor: Ages 10-17
   ├── Guardian: Parent/Relative
   ├── Balance: PHP 15,000-50,000
   ├── Withdrawal Rules: Guardian approval required
   └── Maturity Transition: Age 18

6. Joint Account (2 accounts)
   ├── Account Holders: 2-3 people
   ├── Signatory Rule: AND/OR
   ├── Balance: PHP 200,000
   ├── Permissions: Co-owners can deposit independently
   └── Withdrawal: Per signatory rule
```

**Sample Data Requirements:**
- [ ] 30-40 savings accounts across all 6 types
- [ ] Account opening dates spread over 12-24 months
- [ ] Varied account balances
- [ ] Goal savings with different completion percentages
- [ ] Minor accounts with guardian linkage
- [ ] Joint accounts with co-owner details

---

### ✅ 3.2 Interest Computation
**Priority for demo data: HIGH** ⭐⭐⭐

Generate interest calculation scenarios:

```
Demo Interest Posting Records:
1. Daily Balance Method (Regular Passbook)
   Period: February 2026
   ├── Day 1-5: Balance PHP 40,000
   │   Interest: PHP 40,000 × 5.4% ÷ 365 × 5 = PHP 29.32
   ├── Day 6-15: Balance PHP 50,000 (after deposit)
   │   Interest: PHP 50,000 × 5.4% ÷ 365 × 10 = PHP 73.97
   ├── Day 16-28: Balance PHP 48,500 (after withdrawal)
   │   Interest: PHP 48,500 × 5.4% ÷ 365 × 13 = PHP 88.65
   └── Total Monthly Interest: PHP 191.94

2. Average Daily Balance (Corporate Account)
   Period: February 2026
   ├── Daily Balances: [1,000,000, 1,050,000, 1,050,000, ...]
   ├── Average: PHP 1,025,000
   └── Monthly Interest: PHP 4,609.59

3. Interest Tier (Higher rates for higher balances)
   ├── Balance 0-100,000: 3.5% annually
   ├── Balance 100,001-500,000: 4.5% annually
   ├── Balance 500,001+: 5.5% annually
   └── Account Balance: PHP 250,000 → Rate: 4.5%

4. Withholding Tax (WHT) Deduction
   ├── Gross Interest: PHP 500
   ├── WHT Rate: 20%
   ├── Tax Withheld: PHP 100
   └── Net Credit: PHP 400
```

**Sample Data Requirements:**
- [ ] 20-30 interest posting records
- [ ] Daily balance calculations for 1-6 months
- [ ] Average daily balance examples
- [ ] Interest tier applications
- [ ] WHT calculations and postings
- [ ] Monthly vs. quarterly interest posting examples

---

### ✅ 3.3 Deposit Transactions
**Priority for demo data: MEDIUM** ⭐⭐⭐

Generate transaction records:

```
Demo Deposit Transactions (February 2026):
├── Cash Deposits: 50 transactions
│   ├── Amount Range: PHP 1,000 - 100,000
│   ├── Teller: Different tellers across branches
│   └── Sample: 2026-02-05, Cash-in PHP 25,000, Teller: Maria
├── Withdrawals: 30 transactions
│   ├── Amount Range: PHP 500 - 50,000
│   ├── Status: Over-the-counter or ATM
│   └── Sample: 2026-02-08, Withdrawal PHP 10,000, ATM
├── Fund Transfers: 20 transactions
│   ├── Type: Internal between accounts of same customer
│   ├── Amount: PHP 5,000 - 50,000
│   └── Sample: 2026-02-10, Transfer PHP 20,000 (Savings → Loan Payment)
└── Standing Orders: 5 active orders
    ├── Frequency: Monthly
    ├── Amount: PHP 5,000 - 20,000
    └── Sample: Monthly mortgage payment (auto-debit from savings)
```

**Sample Data Requirements:**
- [ ] 100-150 transaction records spanning 3-6 months
- [ ] Mix of deposit, withdrawal, and transfer types
- [ ] Teller assignment for cash transactions
- [ ] Standing order schedules (monthly/quarterly)
- [ ] Transaction timestamps and reference numbers

---

### ✅ 3.4 Passbook / e-Statement
**Priority for demo data: MEDIUM** ⭐⭐

Generate statement examples:

```
Sample e-Statement: February 2026
┌─────────────────────────────────┐
│ SAVINGS STATEMENT               │
│ Account: 1001-0001              │
│ Account Holder: Juan dela Cruz  │
│ Statement Period: Feb 1-29, 2026│
├─────────────────────────────────┤
│ Opening Balance: PHP 40,000      │
│ Total Deposits: PHP 75,000       │
│ Total Withdrawals: PHP 25,000    │
│ Interest Credited: PHP 200       │
│ Closing Balance: PHP 90,200      │
├─────────────────────────────────┤
│ TRANSACTIONS:                   │
│ Feb 5:  Deposit +25,000 = 65,000│
│ Feb 10: Withdrawal -10,000 = 55k│
│ Feb 15: Interest +200 = 55,200  │
│ Feb 20: Transfer +35,000 = 90.2k│
└─────────────────────────────────┘
```

**Sample Data Requirements:**
- [ ] 5-10 complete statement examples (PDF format)
- [ ] Monthly e-statement templates
- [ ] Statement generation timestamps

---

## Phase 4: Compliance, Reporting & Risk — Demo Data Assessment

### ⏳ 4.1 KYC / AML Compliance
**Priority for demo data: NOT YET IMPLEMENTED** ❌

These features need completion before demo data generation:
- [ ] KYC document management UI
- [ ] AML screening integration
- [ ] Watchlist checking
- [ ] SAR/CTR flagging logic

**Future Demo Data:**
- [ ] 5 KYC documents marked as verified
- [ ] 2-3 flagged customers for AML review
- [ ] Sample watchlist matches
- [ ] CTR records for high-value transactions

---

### ⏳ 4.2-4.4 Regulatory Reporting & Financial Statements
**Priority for demo data: NOT YET IMPLEMENTED** ❌

These require backend completion:
- [ ] Reporting engine development
- [ ] Financial statement builders
- [ ] Period closing workflow

**Future Demo Data:**
- [ ] Trial Balance report (month-end)
- [ ] Income Statement (P&L) for 6 months
- [ ] Balance Sheet snapshot
- [ ] Portfolio At Risk (PAR) report

---

## Phase 5 & 6: Digital & Advanced Features — Demo Data Assessment

### ⏳ 5.1-6.3 Advanced Features
**Priority for demo data: NOT YET IMPLEMENTED** ❌

Not yet ready for demo data.

---

## Recommended Demo Data Generation Strategy

### Priority Tiers:

**🔴 Tier 1 (CRITICAL) — Generate First:**
1. **User Accounts** (Multiple roles + branches)
2. **Customer Profiles** (25-50 diverse customers)
3. **Loan Products** (4-6 sample products)
4. **Loan Applications** (30-50 across workflow stages)
5. **Amortization Schedules** (20-30 loans)
6. **Savings Accounts** (30-40 across types)

**🟡 Tier 2 (HIGH) — Generate Second:**
1. Repayment records (paid, partial, overdue)
2. Collections aging buckets
3. GL entries and accounting records
4. Interest posting records
5. Disbursement records

**🟢 Tier 3 (MEDIUM) — Generate After:**
1. Transaction records (deposit, withdrawal, transfer)
2. Standing orders
3. Statement generation logs
4. Background task records

---

## Implementation Roadmap

### Step 1: Create Demo Data Seeder (Backend)
```python
# File: lending-mvp/backend/app/management/commands/seed_demo_data.py
# OR: lending-mvp/backend/app/utils/demo_seeder.py

Features:
├── Seed Chart of Accounts ✅ (Already exists)
├── Seed Branches
├── Seed Users (Multi-role)
├── Seed Customers (Individual, Joint, Corporate)
├── Seed Loan Products
├── Seed Loan Applications
├── Seed Disbursements
├── Seed Amortization Schedules
├── Seed Savings Accounts
├── Seed Interest Postings
├── Seed GL Entries
└── Seed Collections Data
```

### Step 2: Add Demo Data Toggle
```python
# In main.py startup
if DEMO_MODE or ENVIRONMENT == "development":
    await seed_demo_data()
    logger.info("Demo data seeded for exploration")
```

### Step 3: Frontend Display
- Dashboard displays realistic sample data
- Charts show trends
- Tables show pagination with 100+ records
- Forms pre-populate with examples

### Step 4: Documentation
- "How to Explore Demo Data" guide
- Scenario walkthroughs
- Feature demonstrations

---

## Risk Considerations

✅ **Good to generate:**
- All read-only demo scenarios (view-only dashboards)
- Historical transaction records
- Completed loan cycles
- Aging bucket snapshots

⚠️ **Caution:**
- Live calculation scenarios (might confuse users about real calculations)
- Time-sensitive data (interest accrual, maturity dates)
- Production-like security configurations

❌ **DO NOT generate:**
- Real customer PII (use fake names)
- Real bank account numbers
- Real ID numbers
- Sensitive documents (use placeholder images)

---

## Recommended Sample Data Standards

### Names & Contact Info:
```
Use: Juan dela Cruz, Maria Santos, Pedro Garcia (local names)
     juan.sample@example.com, maria.sample@example.com
     +63 900 SAMPLE 1, +63 900 SAMPLE 2
NOT: Real employee names, Real customer names from production
```

### Amounts:
```
Use: Realistic PHP amounts matching local market
     Personal: 50k-500k, Home: 500k-2M, Business: 250k-5M
NOT: Extremely large/small amounts that mislead users
```

### Dates:
```
Use: Dates spanning last 12 months + future projection
     Current date: Feb 20, 2026
     Past range: Feb 2025 - Feb 2026
     Future: Maturity dates up to 12 months ahead
NOT: Hardcoded dates that become stale
```

---

## Conclusion

**✅ RECOMMENDATION: Proceed with Demo Data Generation**

**Expected User Benefits:**
- 🎯 **Better Feature Exploration** — See all features in action immediately
- 📊 **Realistic Scenarios** — Learn from completed loan cycles, collections workflows
- ⏱️ **Time Savings** — No need to manually create test data
- 🎓 **Better Onboarding** — New users grasp system capabilities faster
- 🧪 **Testing Ground** — Safe environment to explore without impacting production

**Implementation Effort:** ~10-15 hours  
**Maintenance:** Minimal (run seeder on fresh database only)

---

*Analysis completed: February 20, 2026*  
*For questions, see: LENDING_APP_GUIDE.md, QUICKSTART.md*
