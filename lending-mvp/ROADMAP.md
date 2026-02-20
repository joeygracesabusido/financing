# 🏦 Lending & Savings Management System — Industry-Standard Feature Roadmap

> **Vision**: Build a bank-grade lending and savings platform that meets regulatory compliance, provides a seamless digital banking experience, and supports the full lifecycle of financial products.

---

## Current State (Baseline)

| Feature | Status |
|---|---|
| Customer CRUD | ✅ Done |
| Savings Accounts (Regular) | ✅ Done |
| Deposits & Withdrawals | ✅ Done |
| Loan Creation | ✅ Done |
| Loan Products | ✅ Done |
| Basic Auth (JWT) | ✅ Done |
| Minimum Balance Enforcement | ✅ Done |

---

## Phase 1 — Foundation & Core Banking (Months 1–3)

> **Goal**: Make the core engine production-ready, compliant, and scalable.

### 1.1 Infrastructure
- [ ] **Migrate DB to PostgreSQL** — relational integrity for financial data (ACID compliance)
- [ ] **Alembic migrations** — version-controlled schema changes
- [ ] **Redis** — session management, rate limiting, background job queues (Celery/ARQ)
- [ ] **React frontend** — modern SPA with role-based views
- [ ] **Background task queue** — async loan calculations, notifications, statement generation

### 1.2 User & Role Management
- [ ] **Multi-role system**: Admin, Loan Officer, Teller, Branch Manager, Auditor, Customer (self-service)
- [ ] **Branch/Office management** — multi-branch support
- [ ] **Audit logs** — every action logged with user, timestamp, IP
- [ ] **Two-Factor Authentication (2FA)** — TOTP (Google Authenticator) or SMS OTP
- [ ] **Password policies** — expiry, complexity, history
- [ ] **Session management** — concurrent session limits, forced logout

### 1.3 Customer (Member) Management
- [ ] **KYC workflow** — document upload (government ID, proof of address), verification status
- [ ] **Customer risk profile** — risk scoring based on KYC data
- [ ] **Customer categories** — Individual, Joint, Corporate/Business
- [ ] **Beneficiaries/Next of Kin** — linked contact persons
- [ ] **Customer timeline/activity log** — full audit trail per customer
- [ ] **Duplicate detection** — alert on similar names/IDs

---

## Phase 2 — Loan Lifecycle Management (Months 3–6)

> **Goal**: Match industry-standard microfinance/bank loan processing capabilities.

### 2.1 Loan Products (Enhanced)
- [ ] **Amortization types**: Flat rate, Declining balance, Balloon payment, Interest-only
- [ ] **Repayment frequencies**: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Bullet
- [ ] **Grace periods** — principal-only and full grace periods
- [ ] **Penalty/late fee engine** — configurable penalty rates, waiver workflow
- [ ] **Origination fees** — deducted upfront or spread across installments
- [ ] **Prepayment rules** — allowed, restricted, with/without penalty
- [ ] **Loan limits per customer** — individual borrowing cap

### 2.2 Loan Application & Approval
- [ ] **Multi-stage approval workflow** — Loan Officer → Branch Manager → Credit Committee
- [ ] **Credit scoring engine** — 5 Cs (Character, Capacity, Capital, Collateral, Conditions)
- [ ] **Debt-to-Income (DTI) ratio check** — automated eligibility assessment
- [ ] **Collateral management** — register assets (land, vehicle, jewelry) against loans
- [ ] **Co-maker/guarantor support** — linked guarantor profiles
- [ ] **Loan application forms** with document attachments (payslips, ITR, COE)
- [ ] **Loan calculator** — client-facing amortization schedule preview

### 2.3 Loan Disbursement
- [ ] **Disbursement methods**: Cash, check, transfer to savings, mobile money
- [ ] **Disbursement checklist** — pre-disbursement requirements tracking
- [ ] **Loan releases** — partial disbursement (tranches) for construction loans

### 2.4 Loan Repayment & Collections
- [ ] **Amortization schedule** — auto-generated with expected due dates
- [ ] **Repayment posting** — principal vs. interest vs. penalty split (waterfall logic)
- [ ] **OR (Official Receipt) generation** — printable receipts for each payment
- [ ] **Overpayment handling** — credit to next period or savings
- [ ] **Restructuring/Refinancing** — extend term, adjust rate, capitalize arrears
- [ ] **Write-off workflow** — approval chain, provision entries
- [ ] **Collections dashboard** — aging buckets (Current, 1–30, 31–60, 61–90, 90+ DPD)
- [ ] **Promise-to-Pay (PTP) tracking** — collection call outcomes logged

### 2.5 Loan Accounting (Double-Entry)
- [ ] **General Ledger (GL)** — double-entry bookkeeping for every transaction
- [ ] **Chart of Accounts (CoA)** — standard banking CoA (Assets, Liabilities, Capital, Income, Expense)
- [ ] **Loan disbursement journal** — Dr: Loans Receivable, Cr: Cash/Savings
- [ ] **Interest accrual** — daily/monthly accrual entries
- [ ] **Provision for loan losses** — based on PAR aging

---

## Phase 3 — Savings & Deposit Products (Months 4–7)

> **Goal**: Full savings bank functionality.

### 3.1 Savings Account Types
- [ ] **Regular Passbook Savings** (existing, enhanced)
- [ ] **Time Deposit / Certificate of Deposit (CD)** — fixed term, higher rate, maturity handling
- [ ] **Share Capital Account** (for cooperatives) — mandatory savings tied to membership
- [ ] **Christmas Club / Goal Savings** — target amount + target date
- [ ] **Minors' Savings Account** — minor-specific rules, guardian linkage
- [ ] **Joint Accounts** — multiple signatories (AND/OR rules)

### 3.2 Interest Computation
- [ ] **Daily balance method** — compute interest on end-of-day balance
- [ ] **Average daily balance (ADB)** — monthly average
- [ ] **Interest posting** — configurable frequency (monthly, quarterly, annually)
- [ ] **Withholding tax (WHT) deduction** — auto-deduct at interest posting
- [ ] **Interest rate tiers** — higher rates for higher balances

### 3.3 Deposit Transactions
- [ ] **Cash-in / Cash-out** (enhanced with teller session tracking)
- [ ] **Fund transfer between accounts** — internal transfers
- [ ] **Check deposits** — clearing period, hold release schedule
- [ ] **Standing orders / Auto-debit** — scheduled automatic transfers/payments
- [ ] **Balance inquiry** — mobile/online self-service

### 3.4 Passbook / e-Statement
- [ ] **Transaction statement generation** — PDF export, email delivery
- [ ] **Passbook printing support** — dot-matrix formatted output
- [ ] **Monthly e-Statements** — email delivery via SendGrid/AWS SES

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

*Last updated: February 2026 | Maintained by: Engineering Team*
