# Phase 4 – End-to-End Testing Guide

> **As of:** March 2026  
> **Stack:** React frontend (`http://localhost:3010`) · FastAPI/GraphQL backend (`http://localhost:8001/graphql`)  
> **Default admin credentials:** `admin` / `Admin@123Demo`

---

## Demo Data Seeded for Phase 4

The following interconnected records are present after running the demo seeder:

| Dataset | Count | Purpose |
|---|---|---|
| KYC Documents | 77 | Various statuses: `verified`, `pending`, `rejected` |
| PEP Records | 5 | Triggers PEP screening alerts |
| AML Alerts | 9 | Linked to real CTR transaction IDs |
| CTR Transactions | 2 | PHP 750k & PHP 580k — exceeds BSP threshold |
| Overdue Loans | 3 | Covers PAR30 / PAR60 / PAR90 buckets |
| GL Journal Entries | 9 | 3 months × 3 types (interest, fee, opex) |
| Customer Risk Scores | 11 | Persisted to MongoDB per customer |
| Savings Transactions | 132 | Includes CTR-flagged deposits |
| Loan Repayments | 134 | Linked to active loan portfolios |

---

## Story 1 – KYC Document Management

**Goal:** Compliance officers can review and manage KYC documents.

1. Login as `admin`.
2. Navigate to **Compliance Dashboard** → **KYC Documents**.
3. ✅ Verify you see documents in `Verified`, `Pending`, and `Rejected` states.
4. Click a `Pending` document → review details → click **Approve** or **Reject**.
5. ✅ Verify the list refreshes with the updated status.

**Key seed data:**
- `passport_juandelacruz.pdf` → `verified`
- `drivers_license_mariasantos.pdf` → `pending`
- `utility_bill_josereyes.pdf` → `rejected`

---

## Story 2 – AML Alerts & CTR Flagging

**Goal:** Large cash transactions are auto-flagged as CTR; PEP name matches appear as alerts.

1. Navigate to **Compliance Dashboard** → **AML Alerts**.
2. ✅ Verify 2 alerts with `Type: CTR` and `Severity: high`:
   - Alert references `CTR-CASH-001-2026` (PHP 750,000 deposit)
   - Alert references `CTR-CASH-002-2026` (PHP 580,000 deposit)
3. ✅ Verify at least 1 alert with `Type: PEP`:
   - The alert notes a customer name matched a politically-exposed person ("Bonifacio T. Garcia").
4. ✅ Verify at least 1 alert in each status: `pending_review`, `investigated`, `reported`.
5. Click on a CTR alert → verify the linked savings account transaction is visible.

---

## Story 3 – OFAC / Watchlist Screening

**Goal:** The system can check a customer against external watchlists.

1. Navigate to a customer profile.
2. Click **Run Compliance Check** or **Screen against Watchlist**.
3. ✅ Verify the system returns a result (clean or match) without errors.
4. For the customer "Bonifacio T. Garcia" — ✅ verify the PEP flag shows on their profile.

---

## Story 4 – Portfolio At Risk (PAR) Metrics

**Goal:** Overdue loans are classified into PAR buckets and reflected in risk reporting.

1. Navigate to **Compliance Dashboard** → **Portfolio At Risk** or **Reports → PAR**.
2. ✅ Verify non-zero values for:

   | Metric | Expected Loan | DPD | Outstanding |
   |---|---|---|---|
   | PAR30 | LOAN-OD-001 (Rosa Villanueva) | 35 DPD | PHP 58,500 |
   | PAR60 | LOAN-OD-002 (Carlos Mendoza) | 67 DPD | PHP 318,000 |
   | PAR90 / NPL | LOAN-OD-003 (Ana Reyes) | 95 DPD | PHP 195,000 |

3. Navigate to **Loans** → find `LOAN-OD-003`:
   - ✅ Status should be `overdue` or `non-performing`.
   - ✅ A penalty transaction (`PEN-LOAN-OD-003-001`) should be present.

---

## Story 5 – Non-Performing Loans (NPL) & Loan Loss Reserve (LLR)

**Goal:** Loans 90+ DPD are classified as NPL; LLR is calculated accordingly.

1. Navigate to **Reports → NPL Report** (or the Compliance Dashboard NPL section).
2. ✅ Verify `LOAN-OD-003` (95 DPD) appears under the NPL section.
3. ✅ Verify the LLR figure is non-zero (driven by the outstanding balance of NPL loans).

---

## Story 6 – Financial Statements (Trial Balance, P&L, Balance Sheet)

**Goal:** 3 months of GL journal entries produce accurate financial reports.

Seeded journal entries cover **December 2025, January 2026, February 2026** with these figures:

| Month | Interest Income | Fee Income | Operating Expenses |
|---|---|---|---|
| Dec 2025 | PHP 87,500 | PHP 12,500 | PHP 45,000 |
| Jan 2026 | PHP 92,000 | PHP 15,200 | PHP 47,500 |
| Feb 2026 | PHP 96,750 | PHP 14,800 | PHP 49,200 |

### 6a – Trial Balance
1. Navigate to **Accounting → Trial Balance**.
2. ✅ Verify **Total Debits = Total Credits** (double-entry integrity).
3. ✅ Account codes `1000`, `1200`, `2000`, `4100`, `4200`, `5100` should appear with balances.

### 6b – Income Statement (P&L)
1. Navigate to **Accounting → Income Statement**.
2. ✅ For February 2026:
   - Interest Income ≈ PHP 96,750
   - Fee Income ≈ PHP 14,800
   - Operating Expenses ≈ PHP 49,200
   - Net Income = (96,750 + 14,800) − 49,200 = **PHP 62,350**
3. ✅ Verify the arithmetic is shown correctly in the UI.

### 6c – Balance Sheet
1. Navigate to **Accounting → Balance Sheet**.
2. ✅ Verify Assets = Liabilities + Equity (accounting equation holds).

---

## Story 7 – Period Closing

**Goal:** Accounting periods can be formally closed.

1. Navigate to **Accounting → Period Closing**.
2. Select **February 2026** as the period.
3. Click **Close Period**.
4. ✅ Verify the period is marked as `closed` and no further journal entries can be posted for that period.

---

## Story 8 – Customer Risk Profiles

**Goal:** Each customer has a computed risk score visible on their profile and in the dashboard.

1. Navigate to **Customers → [any customer]**.
2. ✅ Verify `Risk Score`, `KYC Status`, and `AML Risk Level` fields are populated.

   | Field | Expected Values |
   |---|---|
   | Risk Score | 15 – 90 (varies per customer) |
   | KYC Status | `verified`, `pending`, or `rejected` |
   | AML Risk Level | `low`, `medium`, or `high` |

3. Navigate to **Compliance Dashboard → Customer Risk Summary**.
4. ✅ Verify the distribution of risk levels is shown (low / medium / high counts).

---

## GraphQL Verification (Optional – API Level)

Direct GraphQL queries to `http://localhost:8001/graphql`:

### Check AML Alerts
```graphql
query {
  amlAlerts(limit: 5) {
    id
    alertType
    severity
    transactionId
    status
    customerName
  }
}
```

### Check PAR Metrics
```graphql
query {
  parMetrics {
    par1
    par7
    par30
    par90
    npl
  }
}
```

### Check Trial Balance
```graphql
query {
  trialBalance {
    accountCode
    accountName
    totalDebit
    totalCredit
  }
}
```

---

## Running the Playwright E2E Suite

```bash
cd lending-mvp/frontend-react
npx playwright test tests/comprehensive-roadmap-e2e.spec.ts --headed
```

Key Phase 4 test groups to watch:
- `Compliance Dashboard - AML Alerts`
- `Compliance Dashboard - KYC Documents`
- `Financial Reports - Trial Balance`
- `Financial Reports - Income Statement`
- `Risk Management - PAR Metrics`

---

## Troubleshooting

| Issue | Fix |
|---|---|
| AML alerts show 0 | Re-run seeder; check CTR transactions exist first |
| GL entries show 0 | Ensure `gl_accounts` table is populated (seeder auto-provisions them) |
| PAR shows 0 | Confirm `LOAN-OD-001/002/003` exist in PostgreSQL `loan_applications` |
| Risk scores not visible | Customer MongoDB doc must have `risk_score` field (seeder writes it) |
| GraphQL 404 on compliance routes | Ensure `AMLComplianceQuery` registered in `main.py` (already fixed) |
