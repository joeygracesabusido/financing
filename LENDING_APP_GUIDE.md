# MVP Lending & Accounting System: A Step-by-Step Guide

**Author:** Gemini Expert Full-Stack Developer
**Date:** January 29, 2026
**Tech Stack:** FastAPI, Strawberry (GraphQL), MongoDB, Vanilla JS, Tailwind CSS, Docker

---

### **IMPORTANT LEGAL DISCLAIMER**

This guide provides a technical blueprint for an MVP lending application. It is **NOT LEGAL ADVICE**. The lending industry in the Philippines is heavily regulated by the **Bangko Sentral ng Pilipinas (BSP)** and the **Securities and Exchange Commission (SEC)**.

- **Consult a Philippine Fintech Lawyer:** Before writing a single line of production code, engage a qualified lawyer specializing in Philippine fintech regulations. They can advise on licensing, corporate structure, and compliance.
- **Licensing is Mandatory:** Operating a lending or financing company requires a license from the SEC. Offering services that resemble banking (e.g., taking deposits) without a BSP digital bank license is illegal.
- **Regulatory Compliance is Critical:** You must adhere strictly to:
    - **KYC/AML Laws:** Know-Your-Customer and Anti-Money Launding regulations to prevent financial crime.
    - **Data Privacy Act (PDPA):** Republic Act No. 10173 for protecting personal data.
    - **Interest Rate Caps:** While specific caps can change, the SEC and BSP monitor for excessive rates.
    - **Fair Debt Collection Practices:** SEC Memorandum Circular 18, series of 2019, outlines lawful collection practices.
    - **Credit Information System Act:** Republic Act No. 9510 requires reporting to the Credit Information Corporation (CIC) and other credit bureaus.
- **Partnering may be an option:** Consider partnering with an existing licensed entity to de-risk your market entry.

---

## 1. High-Level Architecture

The architecture is a standard three-tier model, containerized for portability.

```
+------------------+      +--------------------------------+      +-----------------+
|   Frontend       |      |         Backend Server         |      |    Database     |
| (Vanilla JS,     |      |  (FastAPI + Strawberry GQL)    |      |   (MongoDB)     |
|  Tailwind CSS)   |      |                                |      |                 |
| [Served by Nginx]| <--->|      [FastAPI Container]       | <--->| [Mongo Container]|
+------------------+      +--------------------------------+      +-----------------+
       ^
       |
       |
       | User via Browser
       | (Mobile/Desktop)
```

- **Frontend:** A responsive single-page application (SPA) built with Vanilla JS for logic and Tailwind CSS for styling. It communicates with the backend via REST and GraphQL APIs. It's served as a static site by a lightweight Nginx web server.
- **Backend:** A Python FastAPI application handles all business logic. It exposes:
    - **REST Endpoints:** For straightforward, command-like operations (e.g., `POST /loans` to submit an application).
    - **GraphQL Endpoints:** Powered by Strawberry for complex, nested data queries (e.g., fetching a borrower's complete profile with all loans, repayments, and ledger history in one request).
- **Database:** A MongoDB instance stores all data. The `motor` async driver is used by FastAPI. Multi-document ACID transactions are crucial for ensuring the integrity of the double-entry accounting system.

---

## 2. Local Development Setup

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- A text editor (e.g., VS Code)

### Initial Project Structure

Create the following folder structure for your project.

```
/lending-mvp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schema.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── accounting_service.py
│   │   │   └── loan_service.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── decimal_utils.py
│   │   ├── auth.py
│   │   └── config.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── docker-compose.yml
```

### Backend Dependencies

Create `backend/requirements.txt` with the following content:

```txt
# FastAPI & Server
fastapi
uvicorn[standard]

# GraphQL
strawberry-graphql[fastapi]

# Database
motor
pymongo

# Authentication
python-jose[cryptography]
passlib[bcrypt]

# Configuration
pydantic-settings

# For handling decimals
python-decimal
```

---

## 3. Docker Setup

Containerization ensures a consistent environment for development and deployment.

### Backend `Dockerfile`

Create `backend/Dockerfile`:

```Dockerfile
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY ./app /app/app

# Command to run the application
# Use --host 0.0.0.0 to make it accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### `docker-compose.yml`

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: lending_db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    build:
      context: ./backend
    container_name: lending_backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app # Mount local code for live reload
    depends_on:
      - mongodb
    environment:
      - DATABASE_URL=mongodb://mongodb:27017
      - DATABASE_NAME=lending_mvp
      - JWT_SECRET_KEY=your_super_secret_key_change_me
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
    restart: unless-stopped

  frontend:
    image: nginx:stable-alpine
    container_name: lending_frontend
    ports:
      - "8080:80"
    volumes:
      - ./frontend:/usr/share/nginx/html # Serve static files
      - ./nginx.conf:/etc/nginx/conf.d/default.conf # Optional: for custom config
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
```

To start all services, run:
```bash
docker-compose up --build
```

---

## 4. Backend Code Structure & Snippets

Here are the key files for the FastAPI backend.

### `backend/app/main.py`

This is the entry point of your application. It sets up FastAPI and includes the GraphQL router.

```python
from fastapi import FastAPI
import strawberry
from strawberry.fastapi import GraphQLRouter
from .schema import Query, Mutation

# Create Strawberry's GraphQL schema
graphql_schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(graphql_schema)

# Create FastAPI app
app = FastAPI(title="Lending MVP API")

# Mount the GraphQL app
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {"message": "Welcome to the Lending MVP API"}

# --- REST Endpoints Example ---
# You can add REST endpoints here for simpler operations
# e.g. from .routes import loan_router
# app.include_router(loan_router, prefix="/api/v1")
```

### `backend/app/database.py`

Manages the connection to MongoDB.

```python
import motor.motor_asyncio
from .config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
db = client[settings.DATABASE_NAME]

# Get collections
user_collection = db["users"]
loan_collection = db["loans"]
ledger_collection = db["ledger_entries"]
```

### `backend/app/models.py`

Pydantic models for your database collections.

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from decimal import Decimal

# Helper for handling MongoDB's ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    hashed_password: str
    full_name: str
    role: str = "borrower" # 'borrower' or 'admin' 
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Loan(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    borrower_id: PyObjectId
    amount_requested: Decimal
    amount_disbursed: Optional[Decimal]
    term_months: int
    interest_rate: Decimal # Annual rate
    status: str = "pending" # pending, approved, active, paid, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LedgerEntry(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    transaction_id: str # Unique ID for the balanced transaction
    account: str # e.g., "Cash", "Loans Receivable"
    amount: Decimal
    entry_type: str # 'debit' or 'credit'
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

### `backend/app/schema.py`

Strawberry types, queries, and mutations for the GraphQL API.

```python
import strawberry
from typing import List, Optional
from decimal import Decimal
from .services import accounting_service, loan_service

# --- Strawberry Types (mirroring Pydantic models) ---

@strawberry.type
class LoanType:
    borrower_id: str
    amount_requested: Decimal
    status: str

@strawberry.type
class LedgerEntryType:
    transaction_id: str
    account: str
    amount: Decimal
    entry_type: str
    timestamp: str

# --- GraphQL Queries ---

@strawberry.type
class Query:
    @strawberry.field
    async def get_loan_by_id(self, loan_id: str) -> Optional[LoanType]:
        # Placeholder for fetching loan
        # In a real app, you'd call a service function
        return LoanType(borrower_id="some_user", amount_requested=Decimal("1000"), status="pending")

    @strawberry.field
    async def get_borrower_ledger(self, borrower_id: str) -> List[LedgerEntryType]:
        # This is where GraphQL shines: complex, nested queries
        entries = await accounting_service.get_ledger_for_borrower(borrower_id)
        return [
            LedgerEntryType(
                transaction_id=e["transaction_id"],
                account=e["account"],
                amount=e["amount"],
                entry_type=e["entry_type"],
                timestamp=str(e["timestamp"])
            ) for e in entries
        ]

# --- GraphQL Mutations ---

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def disburse_loan(self, loan_id: str) -> str:
        # Business logic should be in a service layer
        success = await loan_service.disburse_loan(loan_id)
        return "Disbursement successful" if success else "Disbursement failed"
```

---

## 5. MongoDB Schema Design

### Collections
- **`users`**: Stores borrower and admin information. Encrypt PII (Personally Identifiable Information).
- **`loans`**: Contains details of each loan application and its lifecycle.
- **`repayments`**: Tracks every installment paid by a borrower.
- **`ledger_entries`**: The core of the accounting system. Every financial event creates at least two entries (one debit, one credit) here.

### JSON Schema Validation Example
You can enforce schema validation at the database level. Here's an example for the `ledger_entries` collection to ensure required fields and types.

```javascript
// Run this command in the Mongo shell
db.createCollection("ledger_entries", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["transaction_id", "account", "amount", "entry_type", "timestamp"],
      properties: {
        transaction_id: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        account: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        amount: {
          bsonType: "decimal",
          description: "must be a decimal and is required"
        },
        entry_type: {
          enum: ["debit", "credit"],
          description: "can only be one of the enum values and is required"
        },
        timestamp: {
            bsonType: "date",
            description: "must be a date and is required"
        }
      }
    }
  }
})
```

### Transaction Usage
Use Motor's `with_start_transaction` for atomic operations, especially for double-entry posting.

---

## 6. Frontend Code Structure & Snippets

A minimal setup for a Vanilla JS frontend.

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lending App</title>
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold">Lending App MVP</h1>
        <!-- Content will be rendered here by app.js -->
        <div id="app-content"></div>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

### `frontend/app.js`

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    appContent.innerHTML = '<p>Welcome, Borrower! View your loans below.</p>';
    
    // Example: Fetching data using GraphQL
    fetchBorrowerLedger('some_borrower_id');
});

async function fetchBorrowerLedger(borrowerId) {
    const graphqlQuery = {
        query: `
            query GetLedger($borrowerId: String!) {
                getBorrowerLedger(borrowerId: $borrowerId) {
                    transaction_id
                    account
                    amount
                    entry_type
                    timestamp
                }
            }
        `,
        variables: {
            borrowerId: borrowerId
        }
    };

    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
            },
            body: JSON.stringify(graphqlQuery)
        });

        const result = await response.json();
        console.log('Ledger History:', result.data.getBorrowerLedger);
        // Here you would render the results to the DOM
    } catch (error) {
        console.error('Error fetching ledger:', error);
    }
}
```

---

## 7. API Examples

### REST Endpoint (using FastAPI)
You would define this in a separate `routes` file and include it in `main.py`.

```python
# In a hypothetical backend/app/routes/loan_router.py

from fastapi import APIRouter, Depends
# ... other imports

router = APIRouter()

@router.post("/loans", status_code=201)
async def submit_loan_application(loan_application: LoanApplicationSchema, current_user: User = Depends(get_current_user)):
    # 1. Validate input
    # 2. Run basic credit scoring placeholder
    # 3. Save loan application to DB with "pending" status
    # 4. Return response
    pass
```

### GraphQL Query (using Strawberry)

This is already defined in `schema.py`. A client would send this POST request to `/graphql`:

**Request Body:**
```json
{
  "query": "query GetLoan { get_loan_by_id(loan_id: \"some_id\") { status amount_requested } }"
}
```

**Response Body:**
```json
{
  "data": {
    "get_loan_by_id": {
      "status": "pending",
      "amount_requested": "1000"
    }
  }
}
```

---

## 8. Key Logic Snippets

### Amortization Calculator (Diminishing Balance)

```python
# In a service or util file
from decimal import Decimal, ROUND_HALF_UP

def calculate_amortization_schedule(principal: Decimal, annual_rate: Decimal, term_months: int):
    monthly_rate = annual_rate / Decimal('12')
    
    # Formula for Equated Monthly Instalment (EMI)
    if monthly_rate == 0:
        emi = principal / Decimal(term_months)
    else:
        emi = (principal * monthly_rate * (1 + monthly_rate) ** term_months) / \
              (((1 + monthly_rate) ** term_months) - 1)
    
    emi = emi.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    schedule = []
    remaining_balance = principal
    
    for month in range(1, term_months + 1):
        interest_payment = (remaining_balance * monthly_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        principal_payment = emi - interest_payment
        remaining_balance -= principal_payment
        
        # Ensure final payment clears the balance
        if month == term_months and remaining_balance != 0:
            principal_payment += remaining_balance
            remaining_balance = Decimal('0.00')

        schedule.append({
            "month": month,
            "emi": emi,
            "principal_payment": principal_payment,
            "interest_payment": interest_payment,
            "remaining_balance": remaining_balance,
        })
        
    return schedule
```

### Double-Entry Posting Function
This is the most critical function for data integrity.

```python
# In backend/app/services/accounting_service.py
from ..database import db, client, ledger_collection
from decimal import Decimal
import uuid

async def post_transaction(debit_account: str, credit_account: str, amount: Decimal, tx_id: str = None):
    """
    Posts a balanced debit/credit transaction atomically.
    """
    if amount <= 0:
        raise ValueError("Transaction amount must be positive.")

    transaction_id = tx_id or str(uuid.uuid4())
    
    debit_entry = {
        "transaction_id": transaction_id,
        "account": debit_account,
        "amount": amount,
        "entry_type": "debit"
    }
    credit_entry = {
        "transaction_id": transaction_id,
        "account": credit_account,
        "amount": amount,
        "entry_type": "credit"
    }

    async with await client.start_session() as session:
        async with session.with_transaction():
            try:
                result = await ledger_collection.insert_many(
                    [debit_entry, credit_entry], 
                    session=session
                )
                print(f"Transaction {transaction_id} posted successfully.")
                return True
            except Exception as e:
                print(f"Transaction failed: {e}")
                # The transaction will be automatically aborted
                return False

# Example Usage for Loan Disbursement:
# await post_transaction(
#     debit_account="Loans Receivable",
#     credit_account="Cash", # Or a funding source account
#     amount=Decimal("50000.00")
# )
```

---

## 9. Testing & Security Notes

- **Testing:**
    - Use `pytest` to write unit tests, especially for your services.
    - **Crucial Test Case:** Write a test that calls `post_transaction`, then queries the `ledger_entries` collection to verify that for any given `transaction_id`, the sum of debits equals the sum of credits.
- **Security:**
    - **Authentication:** Implement JWT-based authentication in `auth.py`. Create `Depends` functions to protect endpoints and get the current user.
    - **Authorization:** Check user roles (`admin` vs. `borrower`) within endpoints to enforce permissions.
    - **Input Validation:** FastAPI's Pydantic integration provides excellent input validation out-of-the-box.
    - **Encryption:** Use the `cryptography` library to encrypt sensitive data (like bank account numbers or other PII) before storing it in the database.
    - **OWASP Top 10:** Be mindful of common vulnerabilities like Injection, Broken Authentication, and Security Misconfiguration.

---

## 10. Deployment Suggestions

- **Docker:** Your `docker-compose.yml` is perfect for local development. For production, you'd deploy these containers to a cloud provider.
- **Cloud Providers:**
    - **MongoDB:** **MongoDB Atlas** is the recommended managed solution. They have a generous free tier for development. It handles scaling, backups, and security for you.
    - **Backend/Frontend:**
        - **Render** or **Fly.io**: Excellent, developer-friendly platforms for deploying Docker containers. They are often cheaper and simpler than major cloud providers for MVPs.
        - **AWS/GCP/Azure:** More powerful but also more complex. Consider AWS Elastic Beanstalk, Google Cloud Run, or Azure App Service.
- **Philippine Data Residency:** To comply with potential data sovereignty interpretations of the PDPA, consider using a cloud provider with a region in or near Southeast Asia (e.g., AWS has a region in Jakarta, GCP in Singapore).

---

## 11. Challenges & Best Practices

- **Monetary Precision:** **Never use floating-point numbers for money.** The `Decimal` type is mandatory for all financial calculations and storage to avoid rounding errors.
- **Data Consistency:** While MongoDB is flexible, accounting requires strict consistency. Application-level checks and atomic multi-document transactions are your primary tools to enforce this.
- **Idempotency:** Design your mutation APIs (especially for payments) to be idempotent. If a client sends the same request twice due to a network error, it should not result in a duplicate transaction. Use a unique request ID to handle this.
- **Audit Trail:** Log every significant action (loan application, approval, disbursement, payment). This is critical for regulatory compliance and debugging.
- **Scalability:** The proposed architecture scales horizontally. You can add more backend container instances behind a load balancer. Your database will be the main bottleneck, which is why a managed service like MongoDB Atlas is recommended for production.
- **Keep it Simple (MVP):** This guide outlines an MVP. Resist the urge to add complex features like a social credit score or a full-fledged payment gateway initially. Focus on a stable, compliant core product first.
