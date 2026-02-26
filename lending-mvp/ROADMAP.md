# 🏦 Lending & Savings Management System — Industry-Standard Feature Roadmap

> **Vision**: Build a bank-grade lending and savings platform that meets regulatory compliance, provides a seamless digital banking experience, and supports the full lifecycle of financial products.

---

## Current State (Baseline)

| Feature | Status |
|---|---|
| Customer CRUD | ✅ Done |
| Savings Accounts (Regular) | ✅ Done |
| Savings Accounts (Time Deposit, Share Capital, Goal, Minor, Joint) | ✅ Done |
| Deposits & Withdrawals | ✅ Done |
| Fund Transfers | ✅ Done |
| Standing Orders | ✅ Done |
| Interest Computation (ADB, WHT, tiers) | ✅ Done |
| e-Statement Generation (PDF) | ✅ Done |
| Loan Creation | ✅ Done |
| Loan Products (all amortization types) | ✅ Done |
| Basic Auth (JWT + 2FA) | ✅ Done |
| Minimum Balance Enforcement | ✅ Done |
| Credit Scoring (5 Cs) | ✅ Done |
| DTI Ratio Check | ✅ Done |
| Loan Application Documents | ✅ Done |
| Disbursement Checklist | ✅ Done |
| Partial Disbursement (Tranches) | ✅ Done |
| Promise-to-Pay (PTP) Tracking | ✅ Done |
| Official Receipt (OR) PDF Generator | ✅ Done |
| Loan Restructuring (term/rate/arrears) | ✅ Done |
| Loan Calculator (4 types) | ✅ Done |
| Double-Entry Accounting (GL) | ✅ Done |
| Chart of Accounts | ✅ Done |
| Loan Transaction Authorization | ✅ Done (Feb 2026) |
| Daily Interest Worker | ✅ Done (Feb 2026) |
| Savings Detail Page with Passbook | ✅ Done (Feb 2026) |
| e2e Tests (Authorization + Savings) | ✅ Done (Feb 2026) |

---

## Phase 1 — Foundation & Core Banking (Months 1–3)

> **Goal**: Make the core engine production-ready, compliant, and scalable.

### 1.1 Infrastructure
- [x] **Migrate DB to PostgreSQL** — relational integrity for financial data (ACID compliance)
- [x] **Alembic migrations** — version-controlled schema changes
- [x] **Redis** — session management, rate limiting, background job queues (Celery/ARQ)
- [x] **React frontend** — modern SPA with role-based views
- [x] **Background task queue** — async loan calculations, notifications, statement generation

### 1.2 User & Role Management
- [x] **Multi-role system**: Admin, Loan Officer, Teller, Branch Manager, Auditor, Customer (self-service)
- [x] **Branch/Office management** — multi-branch support
- [x] **Audit logs** — every action logged with user, timestamp, IP
- [x] **Two-Factor Authentication (2FA)** — TOTP (Google Authenticator) or SMS OTP
- [x] **Password policies** — expiry, complexity, history
- [x] **Session management** — concurrent session limits, forced logout

### 1.3 Customer (Member) Management
- [x] **KYC workflow** — document upload (government ID, proof of address), verification status
- [x] **Customer risk profile** — risk scoring based on KYC data
- [x] **Customer categories** — Individual, Joint, Corporate/Business
- [x] **Beneficiaries/Next of Kin** — linked contact persons
- [x] **Customer timeline/activity log** — full audit trail per customer
- [x] **Duplicate detection** — alert on similar names/IDs

---

## Phase 2 — Loan Lifecycle Management (Months 3–6)

> **Goal**: Match industry-standard microfinance/bank loan processing capabilities.

### 2.1 Loan Products (Enhanced)
- [x] **Amortization types**: Flat rate, Declining balance, Balloon payment, Interest-only
- [x] **Repayment frequencies**: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Bullet
- [x] **Grace periods** — principal-only and full grace periods
- [x] **Penalty/late fee engine** — configurable penalty rates, waiver workflow
- [x] **Origination fees** — deducted upfront or spread across installments
- [x] **Prepayment rules** — allowed, restricted, with/without penalty
- [x] **Loan limits per customer** — individual borrowing cap

### 2.2 Loan Application & Approval
- [x] **Multi-stage approval workflow** — Loan Officer → Branch Manager → Credit Committee
- [x] **Credit scoring engine** — 5 Cs (Character, Capacity, Capital, Collateral, Conditions)
- [x] **Debt-to-Income (DTI) ratio check** — automated eligibility assessment
- [x] **Collateral management** — register assets (land, vehicle, jewelry) against loans
- [x] **Co-maker/guarantor support** — linked guarantor profiles
- [x] **Loan application forms** with document attachments (payslips, ITR, COE)
- [x] **Loan calculator** — client-facing amortization schedule preview

### 2.3 Loan Disbursement
- [x] **Disbursement methods**: Cash, check, transfer to savings, mobile money
- [x] **Disbursement checklist** — pre-disbursement requirements tracking
- [x] **Loan releases** — partial disbursement (tranches) for construction loans

### 2.4 Loan Repayment & Collections
- [x] **Amortization schedule** — auto-generated with expected due dates
- [x] **Repayment posting** — principal vs. interest vs. penalty split (waterfall logic)
- [x] **OR (Official Receipt) generation** — printable receipts for each payment
- [x] **Overpayment handling** — credit to next period or savings
- [x] **Restructuring/Refinancing** — extend term, adjust rate, capitalize arrears
- [x] **Write-off workflow** — approval chain, provision entries
- [x] **Collections dashboard** — aging buckets (Current, 1–30, 31–60, 61–90, 90+ DPD)
- [x] **Promise-to-Pay (PTP) tracking** — collection call outcomes logged

### 2.5 Loan Accounting (Double-Entry)
- [x] **General Ledger (GL)** — double-entry bookkeeping for every transaction
- [x] **Chart of Accounts (CoA)** — standard banking CoA (Assets, Liabilities, Capital, Income, Expense)
- [x] **Loan disbursement journal** — Dr: Loans Receivable, Cr: Cash/Savings
- [x] **Interest accrual** — daily/monthly accrual entries
- [x] **Provision for loan losses** — based on PAR aging

---

## Phase 3 — Savings & Deposit Products (Months 4–7)

> **Goal**: Full savings bank functionality.

### 3.1 Savings Account Types
- [x] **Regular Passbook Savings** (existing, enhanced)
- [x] **Time Deposit / Certificate of Deposit (CD)** — fixed term, higher rate, maturity handling
- [x] **Share Capital Account** (for cooperatives) — mandatory savings tied to membership
- [x] **Christmas Club / Goal Savings** — target amount + target date
- [x] **Minors' Savings Account** — minor-specific rules, guardian linkage
- [x] **Joint Accounts** — multiple signatories (AND/OR rules)

### 3.2 Interest Computation
- [x] **Daily balance method** — compute interest on end-of-day balance
- [x] **Average daily balance (ADB)** — monthly average
- [x] **Interest posting** — configurable frequency (monthly, quarterly, annually)
- [x] **Withholding tax (WHT) deduction** — auto-deduct at interest posting
- [x] **Interest rate tiers** — higher rates for higher balances

### 3.3 Deposit Transactions
- [x] **Cash-in / Cash-out** (enhanced with teller session tracking)
- [x] **Fund transfer between accounts** — internal transfers
- [x] **Standing orders / Auto-debit** — scheduled automatic transfers/payments
- [x] **Balance inquiry** — mobile/online self-service
- [ ] **Check deposits** — clearing period, hold release schedule
- [ ] **Passbook printing support** — dot-matrix formatted output
- [ ] **Monthly e-Statements** — email delivery via SendGrid/AWS SES

### 3.4 Passbook / e-Statement
- [ ] **Passbook printing support** — dot-matrix formatted output
- [ ] **Monthly e-Statements** — email delivery via SendGrid/AWS SES

---

## Q1 2026 Implementation Status

> **Recent Achievements (Feb 2026)**

| Feature | Status | Details |
|---|---|---|
| **Loan Transaction Authorization** | ✅ Complete | RBAC checks in `backend/app/loan_transaction.py:177-184` |
| **Daily Interest Computation** | ✅ Complete | ARQ cron job at midnight UTC, `worker.py:39-85` |
| **Savings Detail Page** | ✅ Complete | Full page with passbook printing, `SavingsDetailPage.tsx` |
| **e2e Tests** | ✅ Complete | Authorization + Savings tests passing |

### Implementation Details

**Loan Transaction Authorization (Feb 26, 2026)**
- File: `backend/app/loan_transaction.py:177-184, 216-223`
- Staff users can only access transactions for their own loans
- Admin users retain full access
- Authorization verified via borrower_id matching current_user.id
- E2E tests: 3 passing tests (`tests/loan-transaction-authorization.spec.ts`)

**Daily Interest Worker (Feb 26, 2026)**
- File: `backend/app/worker.py:39-85`
- Cron job runs at midnight UTC daily
- Formula: `daily_interest = (balance × (rate / 365)) / 100`
- Posts to ledger via double-entry accounting
- Updates account balance atomically
- Unit tests: All interest computation logic tests passing

**Savings Detail Page with Passbook (Feb 26, 2026)**
- File: `frontend-react/src/pages/SavingsDetailPage.tsx`
- Three tabs: Overview, Transactions, Passbook
- Print passbook functionality with dot-matrix formatted output
- E2E tests: 2 passing tests (`tests/savings-passbook.spec.ts`)

---

## Phase 4 — Compliance, Reporting & Risk (Months 6–10)

> **Goal**: Meet regulatory and audit requirements for financial institutions.

### 4.1 KYC / AML Compliance
- [ ] **KYC document management** — upload, review, approve/reject, expiry alerts
- [ ] **AML screening** — watchlist check (OFAC, local blacklists) on customer onboarding
- [ ] **Suspicious Activity Report (SAR)** flagging
- [ ] **CTR (Currency Transaction Report)** — auto-flag cash transactions > threshold
- [ ] **PEP (Politically Exposed Persons)** flagging

### 4.2 Regulatory Reporting
- [ ] **Loan Portfolio Report** — total outstanding, by product, by branch
- [ ] **Portfolio At Risk (PAR)** — PAR1, PAR7, PAR30, PAR90
- [ ] **Non-Performing Loans (NPL) Report**
- [ ] **Repayment Rate / Collection Efficiency**
- [ ] **Loan Loss Reserve (LLR) Report**
- [ ] **Savings Mobilization Report** — deposits vs. withdrawals
- [ ] **BSP/SEC regulatory reports** (Philippines-specific) or equivalent

### 4.3 Financial Statements
- [ ] **Trial Balance** — auto-generated from GL entries
- [ ] **Income Statement (P&L)** — interest income, fee income, operating expenses
- [ ] **Balance Sheet** — assets, liabilities, capital
- [ ] **Cash Flow Statement**
- [ ] **Period closing** — month-end, quarter-end, year-end close process

### 4.4 Risk Management
- [ ] **Loan-to-Value (LTV) ratio** for collateral
- [ ] **Concentration risk report** — exposure by sector, geography
- [ ] **Liquidity ratio monitoring**

---

## Phase 5 — Digital & Self-Service Features (Months 8–12)

> **Goal**: Enable members/customers to manage their own accounts digitally.

### 5.1 Customer Portal / Mobile App
- [ ] **Account summary dashboard** — balances, loan status, next due date
- [ ] **Loan application (online)** — paperless onboarding
- [ ] **Repayment history** — downloadable statements
- [ ] **Fund transfer request**
- [ ] **Notifications** — SMS, email, push (due date reminders, payment confirmations)
- [ ] **QR code payments** — generate QR for teller payment collection

### 5.2 Payment Gateway Integration
- [ ] **GCash / Maya integration** (Philippines) or **Stripe / PayPal** (international)
- [ ] **InstaPay / PESONet** (BSP real-time payment rails)
- [ ] **Auto-debit from linked bank accounts**

### 5.3 Teller Operations
- [ ] **Teller cash drawer management** — opening & closing balance
- [ ] **Till balancing** — end-of-day reconciliation
- [ ] **Teller transaction limits** — configurable per role

---

## In Progress (Q1 2026)

> **Current focus**: Backend infrastructure, PostgreSQL migration, Redis integration.

### Recent Implementation (Feb 2026)

| Feature | Status |
|---|---|
| PostgreSQL Migration | ✅ Complete |
| Redis Caching & Sessions | ✅ Complete |
| Background Job Queue (ARQ) | ✅ Complete |
| Double-Entry Bookkeeping | ✅ Complete |
| Credit Scoring Engine | ✅ Complete |
| DTI Ratio Calculator | ✅ Complete |
| Loan Tranche Management | ✅ Complete |
| Loan Restructuring | ✅ Complete |
| OR PDF Generator | ✅ Complete |
| Loan Calculator UI | ✅ Complete |
| PTP Tracking | ✅ Complete |
| Share Capital / Goal / Minor / Joint Accounts | ✅ Complete |

### Next Up (Feb-Mar 2026)

- [ ] **Email notifications** (SendGrid/Twilio integration in `worker.py`)
- [ ] **PDF generation with MinIO/S3** storage
- [ ] **Daily interest computation** for savings accounts (ARQ worker)
- [ ] **Authorization checks** in loan transactions (`loan_transaction.py`)
- [ ] **Passbook printing** (dot-matrix output)
- [ ] **Check deposits** (clearing period & hold release)

---

## Phase 6 — Advanced Features (Year 2+)

### 6.1 Loan Origination System (LOS) Integration
- [ ] **Credit bureau integration** (TransUnion, Equifax, or local CIC)
- [ ] **Automated credit decisioning** — rules engine

### 6.2 Core Banking System (CBS) Integration
- [ ] **ISO 20022 messaging** — standard financial messaging
- [ ] **SWIFT-compatible transfers**
- [ ] **RTGS / SWIFT integration**

### 6.3 AI/Analytics
- [ ] **Predictive default scoring** — ML model on repayment history
- [ ] **Fraud detection** — anomaly detection on transactions
- [ ] **Dynamic pricing engine** — risk-based interest rates

---

## Technology Stack Recommendations

| Layer | Current | Recommended (Production) |
|---|---|---|
| Frontend | Static HTML + Tailwind | **React (Vite) + TypeScript + Tailwind + shadcn/ui** |
| API | FastAPI + Strawberry GraphQL | ✅ Keep (add REST endpoints for mobile) |
| Primary DB | MongoDB | **PostgreSQL 15** (ACID, relational integrity) |
| Cache | None | **Redis 7** (sessions, rate limiting, queues) |
| Task Queue | None | **Celery + Redis** or **ARQ** |
| Auth | JWT | **JWT + Refresh tokens + 2FA** |
| File Storage | None | **AWS S3** or **MinIO** (self-hosted) |
| Email | None | **SendGrid** or **AWS SES** |
| Notifications | None | **Firebase FCM** (push) + **Twilio** (SMS) |
| Monitoring | None | **Prometheus + Grafana** or **Sentry** |
| CI/CD | None | **GitHub Actions** → Docker Hub → VPS/K8s |
| Infrastructure | Docker Compose | **Docker Compose (dev)** → **Kubernetes (prod)** |

---

## Regulatory Compliance Checklist (Philippines — BSP/SEC)

| Requirement | Applicable To | Priority |
|---|---|---|
| BSP Circular 1048 (AML) | All financial institutions | 🔴 High |
| RA 9160 (AMLA) | All | 🔴 High |
| RA 10173 (Data Privacy Act) | All | 🔴 High |
| BSP Manual of Regulations for Banks | Banks/rural banks | 🟡 Medium |
| SEC Registration (lending company) | Lending companies | 🔴 High |
| RA 9474 (Lending Company Regulation Act) | Lending companies | 🔴 High |
| DTI Disclosure requirements | Consumer lending | 🟡 Medium |
| PDIC membership | Banks | 🟡 Medium |

---

*Last updated: February 26, 2026 | Maintained by: Engineering Team*

---

## Recent Updates (Q1 2026)

### February 26, 2026
- ✅ Loan transaction authorization with RBAC enforcement
- ✅ Daily interest computation worker (ARQ cron job)
- ✅ Savings Detail Page with passbook printing
- ✅ E2E tests for authorization and savings features
