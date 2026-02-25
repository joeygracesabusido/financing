# Gemini Lending Application - Project Context

## Project Overview
This is a modern, web-based lending management application designed to handle customer profiles, savings accounts, and loan lifecycles. It utilizes a GraphQL-first approach for data interaction and provides a responsive, real-time dashboard for financial summaries.

## Core Technologies
*   **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS (via CDN).
*   **Backend:** Python 3.10+, FastAPI (Web Framework), Strawberry GraphQL (Schema & API).
*   **Database:** MongoDB (Primary Storage), Redis (Caching & Session/Token Blacklisting).
*   **Containerization:** Docker & Docker Compose.
*   **Infrastructure:** Nginx (Static File Server & Reverse Proxy).

## Architecture & Design Patterns
*   **GraphQL API:** The application uses a modular GraphQL schema. Each entity (Loan, Customer, Savings) has its own Strawberry module and resolvers.
*   **Asynchronous DB Access:** Uses `motor` (asynchronous MongoDB driver) for non-blocking I/O.
*   **Layered Backend:** 
    *   `basemodel/`: Pydantic models for data validation and MongoDB serialization.
    *   `database/`: CRUD modules for encapsulated database operations.
    *   `services/`: Business logic layer (e.g., interest calculation, disbursement logic).
    *   `app/`: Main GraphQL entry points and Strawberry type definitions.
*   **Frontend Modularization:** Static HTML files paired with dedicated JavaScript logic files in `js/`.

## Key Features & Capabilities

### 1. Customer Management
*   Full CRUD operations for borrower profiles.
*   Datalist-based search and autocomplete for efficient selection in transaction forms.

### 2. Savings Management
*   **Account Types:** Regular Savings, High-Yield Savings, and Time Deposits.
*   **Operations:** Deposits and withdrawals with automatic balance updates.
*   **Constraints:** Enforcement of minimum balances (e.g., for Regular Savings).

### 3. Loan Management
*   **Loan Products:** Customizable templates defining interest rates, terms, and payment modes.
*   **Loan Lifecycle:** Application (Pending) -> Disbursement (Active) -> Repayment -> Paid.
*   **Transaction Tracking:** Granular logging of disbursements, repayments, interest charges, fees, and penalties.
*   **Amortization:** Automatic generation and display of amortization schedules.

### 4. Financial Dashboard
*   **Total Balance:** Net worth calculation (Total Savings - Total Outstanding Loans).
*   **Total Savings:** Aggregated balance from all savings accounts.
*   **Total Repayments:** Real-time sum of all loan repayment transactions (Income).
*   **Total Loan Balance:** Sum of outstanding principal and calculated interest for all active loans.

## Development & Operational Commands

### Building and Running
The entire stack is containerized for easy deployment:
```bash
cd lending-mvp
docker-compose up --build -d
```

### Access Points
*   **Frontend:** [http://localhost:8080](http://localhost:8080)
*   **GraphQL Playground:** [http://localhost:8001/graphql](http://localhost:8001/graphql)
*   **MongoDB:** Internal (port 27017, volume-persisted)

### Testing & Data Utility
*   `create_test_data.py`: A utility script to seed the database with mock customers, products, and loans for development.

## Development Conventions
*   **Data Integrity:** Always use Pydantic models in `basemodel/` for database interactions to ensure schema consistency.
*   **Caching:** Critical GraphQL queries use Redis caching. When modifying data, ensure the corresponding cache keys are cleared via the `_clear_*_cache` methods in mutations.
*   **UI/UX:** Use Tailwind CSS for styling. Ensure all new transaction forms support autocomplete/search for borrower and product selection to maintain a fast user experience.
*   **Auth:** JWT-based. Protected resolvers must verify the `current_user` in the GraphQL context.

## Recent Engineering Improvements (Feb 2026)
*   Implemented robust resolvers for `LoanTransactionType` that automatically fetch missing `borrowerName` and `loanProduct` data from the linked loan.
*   Standardized dashboard metrics to focus on "Total Repayments" (Income) and "Total Loan Balance" (Liability).
*   Fixed type mismatch issues in GraphQL mutations (Decimal vs Float serialization).
