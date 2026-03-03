# Design Doc: PostgreSQL-Prioritized Loan Transactions

## Overview
This design aims to fix the missing transaction history on the Loan Detail Page (e.g., loan #486) by updating the GraphQL resolver to fetch data from the PostgreSQL database where recent loan transactions are stored.

## Problem Statement
Current loan transactions (disbursements, repayments, fees, write-offs) are being saved to the PostgreSQL `loan_transactions` table. However, the `loanTransactions` GraphQL resolver is only querying MongoDB, resulting in empty transaction lists for all new loans.

## Proposed Changes

### Backend (Python/Strawberry)

#### 1. Update `lending-mvp/backend/app/loan_transaction.py`
- Import PostgreSQL models: `LoanTransaction` (from `pg_loan_models`).
- Import `get_db_session` from `database.postgres`.
- Update the `loan_transactions` resolver in `LoanTransactionQuery`:
    - Check if the provided `loan_id` is numeric (PostgreSQL ID).
    - If numeric, query the PostgreSQL `loan_transactions` table.
    - If not numeric (legacy), fall back to MongoDB.
    - Implement a mapper to convert PostgreSQL model instances to `LoanTransactionType`.

#### 2. Model Mapping (PostgreSQL -> GraphQL)
| PostgreSQL Model (`LoanTransaction`) | GraphQL Type (`LoanTransactionType`) |
| :--- | :--- |
| `id` | `id` |
| `loan_id` | `loanId` |
| `type` | `transactionType` |
| `amount` | `amount` |
| `timestamp` | `createdAt` / `transactionDate` |
| `description` | `description` / `notes` |
| `receipt_number` | `referenceNumber` |
| `processed_by` | `processedBy` |

### Frontend (React)

#### 1. Update `lending-mvp/frontend-react/src/pages/LoanDetailPage.tsx`
- Ensure the "Transactions" tab correctly renders the mapped fields.
- The `transactionType` should be displayed (e.g., "disbursement", "repayment").
- The `description` field should be used to show the breakdown of repayments (Principal, Interest, Penalty).

## Data Flow
1. Frontend calls `GET_LOAN_TRANSACTIONS` with `loanId: "486"`.
2. Backend resolver `loan_transactions` receives "486".
3. Backend identifies "486" as a PostgreSQL ID.
4. Backend queries PostgreSQL `loan_transactions` table for `loan_id=486`.
5. Backend maps results to `LoanTransactionType` and returns them.
6. Frontend displays transactions in the table.

## Verification Plan
1. **Manual Verification**:
    - Disburse a loan and check the Transactions tab.
    - Make a repayment and check the Transactions tab.
    - Verify all amounts and descriptions match the actual transaction.
2. **Automated Testing**:
    - Add a unit test in `lending-mvp/backend/tests/` to verify the `loan_transactions` resolver returns data from PostgreSQL when given a numeric ID.
