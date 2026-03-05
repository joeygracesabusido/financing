# Gemini Lending Application - Project Context

## Project Overview
The **Gemini Lending Application** is a high-fidelity Lending & Savings Management System designed to handle the full lifecycle of financial products. It features a bank-grade architecture with regulatory compliance features, digital banking capabilities, and a modern micro-services-oriented stack.

### Key Capabilities
- **Core Banking:** User management, Multi-branch support, Audit logging, 2FA.
- **Lending:** Full loan lifecycle (Application → Approval → Disbursement → Repayments), Amortization (Flat, Declining, Balloon), Penalty engine, Collateral management.
- **Savings:** Regular Savings, Time Deposits, Share Capital, Goal Savings, Daily interest computation.
- **Accounting:** Double-entry bookkeeping (General Ledger), Chart of Accounts (Assets, Liabilities, etc.), Automatic journal entries for all financial transactions.
- **Digital Banking:** Customer portal, QR code payments, Payment gateway integration (GCash, Maya, InstaPay, PESONet), Teller operations (Cash drawer management).
- **Compliance:** KYC workflow, AML screening, SAR/CTR flagging, Regulatory reporting (Portfolio at Risk, NPL).

---

## Tech Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **API:** [Strawberry GraphQL](https://strawberry.rocks/) (GraphQL)
- **Databases:** 
  - **MongoDB:** Primary store for document-based collections (Legacy/Current).
  - **PostgreSQL:** Relational integrity for financial data (ACID compliance).
  - **Redis:** Caching, session management, and background task queues.
- **Background Jobs:** [ARQ](https://github.com/samuelcolvin/arq) (Redis-based worker).
- **Security:** JWT Authentication, RBAC (Role-Based Access Control), 2FA (TOTP).

### Frontend
- **Modern:** React (Vite, TypeScript, Tailwind CSS, Radix UI).
- **Legacy:** Plain HTML/JavaScript (supported for compatibility).
- **State/Data:** Apollo Client (GraphQL), React Query, Zustand.

### Infrastructure & DevOps
- **Containerization:** Docker & Docker Compose.
- **Testing:** 
  - **Backend:** Pytest (Unit/Integration).
  - **Frontend/E2E:** Playwright (Comprehensive suite with 70+ tests).

---

## Project Structure

```text
/
├── lending-mvp/
│   ├── backend/                # FastAPI Application
│   │   ├── app/                # Core Logic
│   │   │   ├── auth/           # Authentication & Security
│   │   │   ├── database/       # DB Connections (Mongo, PG, Redis)
│   │   │   ├── basemodel/      # Shared Pydantic models
│   │   │   ├── services/       # Business logic (Accounting, Loans, etc.)
│   │   │   ├── utils/          # Utilities (PDF, QR, Seeders)
│   │   │   ├── main.py         # Entry point
│   │   │   └── schema.py       # GraphQL Schema Root
│   │   ├── alembic/            # PG Migrations
│   │   ├── tests/              # Backend Test Suite
│   │   └── requirements.txt    # Backend Dependencies
│   ├── frontend-react/         # React Application
│   │   ├── src/
│   │   │   ├── api/            # GraphQL Queries/Mutations
│   │   │   ├── components/     # UI Components
│   │   │   ├── pages/          # Application Pages
│   │   │   └── lib/            # Shared Libraries (Gateways, Utilities)
│   │   ├── tests/              # Playwright E2E Tests
│   │   └── package.json        # Frontend Dependencies
│   └── docker-compose.yml      # Service Orchestration
└── image/                      # Project Documentation Images
```

---

## Building and Running

### 🐳 Recommended: Docker
```bash
cd lending-mvp
docker-compose up --build
```
- **Frontend (React):** [http://localhost:3010](http://localhost:3010)
- **Backend (API):** [http://localhost:8001/graphql](http://localhost:8001/graphql)
- **PostgreSQL:** Port 5433
- **MongoDB:** Port 27018
- **Redis:** Port 6380

### 🐍 Backend (Local)
```bash
cd lending-mvp/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### ⚛️ Frontend (Local)
```bash
cd lending-mvp/frontend-react
npm install
npm run dev
```

---

## Testing & Validation

### Backend Tests
```bash
cd lending-mvp/backend
pytest
```

### E2E Tests (Playwright)
```bash
cd lending-mvp/frontend-react
npx playwright test
```
*Note: Ensure services are running via Docker before executing E2E tests.*

---

## Development Conventions

### Coding Style
- **Python:** PEP 8 compliance, explicit type hinting, Pydantic for data validation.
- **Frontend:** TypeScript for type safety, functional React components, Tailwind for styling.
- **GraphQL:** Use CamelCase for input/output fields where possible, but stay consistent with existing SnakeCase schema transitions.

### Key Files for Context
- `lending-mvp/ROADMAP.md`: Detailed feature status and history.
- `lending-mvp/AGENTS.md`: Operational protocol for AI assistants.
- `START_HERE.md`: Summary of recent critical fixes.
- `lending-mvp/backend/app/main.py`: API Entry point and Lifespan logic.
- `lending-mvp/backend/app/database/__init__.py`: PostgreSQL initialization and session factory.
- `lending-mvp/backend/app/graphql.py`: Core GraphQL schema and mutations (Primary for React frontend).

---

## Recent Critical Fixes (March 2026)

### GraphQL Schema & Mutations
- **Loan Creation Fix**: Added `LoanInput` and `LoanResponse` types to the GraphQL schema in `backend/app/graphql.py`. Implemented the `createLoan` mutation to correctly handle loan application submissions from the React frontend.
- **Dynamic Field Resolution**: Enhanced `LoanNode` to resolve `borrowerName` and `productName` dynamically from PostgreSQL (instead of static demo values). This fixed empty/static display issues in the Loan list and detail pages.
- **Virtual Field Support**: Added `referenceNo` and `startDate` as virtual fields to `LoanNode` for frontend compatibility.

### Database Stability
- **PostgreSQL Schema Sync**: Manually updated the `savings_accounts` table to include missing columns required by the ORM metadata (e.g., `maturity_date`, `principal`, `term_days`). This resolved a critical crash during startup/seeding where the database didn't match the model definitions.
- **Query Error Handling**: Fixed a database error in the `loans` query resolver where it was attempting to filter by a non-existent `borrower_name` column in the `loan_applications` table.

---

*This document is generated for Gemini CLI to provide deep project awareness.*
