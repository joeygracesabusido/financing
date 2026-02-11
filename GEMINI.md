# Gemini Lending Application

## Project Overview
This is a simple lending application designed to manage customers, savings accounts, and transactions. It features a web-based frontend and a Python-based GraphQL backend with MongoDB as its database. The application aims to provide a basic framework for tracking financial interactions within a lending context.

## Technologies Used

*   **Frontend:** HTML, JavaScript, Tailwind CSS
*   **Backend:** Python (FastAPI, Strawberry GraphQL)
*   **Database:** MongoDB
*   **Containerization:** Docker, Docker Compose

## Key Features

*   **Customer Management:**
    *   Add new customers.
    *   View all customers.
    *   Search customers by various criteria.
    *   Update customer information.
    *   Delete customers.
*   **Savings Management:**
    *   Create different types of savings accounts (e.g., Regular Savings).
    *   View all savings accounts.
    *   Search savings accounts by account number or customer name.
    *   View details of a specific savings account.
*   **Transaction Management:**
    *   Deposit funds into savings accounts.
    *   Withdraw funds from savings accounts.
    *   Enforce minimum balance rules for specific account types (e.g., Regular Savings).
    *   View transaction history for accounts.
*   **Authentication & Authorization:** Basic user authentication and role-based authorization (e.g., admin role required for certain operations).

## Getting Started

### Prerequisites
*   Docker and Docker Compose installed.
*   Git (for cloning the repository).

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd financing
    ```

2.  **Build and run with Docker Compose:**
    Navigate to the `lending-mvp` directory:
    ```bash
    cd lending-mvp
    docker-compose up --build -d
    ```
    This will build the Docker images for the backend, frontend, and MongoDB, and start the services in detached mode.

3.  **Access the application:**
    *   **Frontend:** Open your web browser and navigate to `http://localhost:8080`
    *   **GraphQL Playground (Backend API):** Navigate to `http://localhost:8000/graphql`

## Application Structure

### Frontend (`lending-mvp/frontend/`)
*   `.html` files: Define the user interface for different pages (dashboard, customer list, savings list, etc.).
*   `js/`: Contains JavaScript files for client-side interactivity and API calls.
    *   `app.js`: General application logic (e.g., navigation, logout).
    *   `customer.js`: Logic for customer-related pages, including fetching and searching customers.
    *   `savings.js`: Logic for savings-related pages, including fetching and searching accounts.
    *   `add_customer.js`, `create_savings.js`, `savings_details.js`, etc.: Specific scripts for form submissions and detail views.
*   `css/`: Contains CSS stylesheets, primarily `dashboard.css`.

### Backend (`lending-mvp/backend/app/`)
*   `main.py`: Entry point for the FastAPI application and GraphQL schema definition.
*   `config.py`: Application configuration settings.
*   `models.py`: Pydantic models for database objects (e.g., `UserInDB`, `PyObjectId`).
*   `basemodel/`: Contains base models for specific entities.
    *   `savings_model.py`: Defines `SavingsAccountBase`, `RegularSavings`, `HighYieldSavings`, `TimeDeposit` Pydantic models.
    *   `transaction_model.py`: Defines `TransactionBase`, `TransactionInDB` models.
*   `database/`: Contains modules for database interactions.
    *   `__init__.py`: Initializes MongoDB client and defines collection access functions (`get_db`, `get_users_collection`, `get_customers_collection`, etc.). Also includes `create_indexes` for database setup.
    *   `crud.py`: Generic CRUD operations (can be expanded).
    *   `customer_crud.py`: CRUD operations specific to customers.
    *   `savings_crud.py`: CRUD operations specific to savings accounts, including search functionality using MongoDB aggregation.
    *   `transaction_crud.py`: CRUD operations specific to transactions, including balance updates and minimum balance checks.
*   `auth/`: Authentication and authorization logic.
    *   `authentication.py`: Handles token generation and user authentication.
    *   `security.py`: Utility functions for password hashing and token validation.
*   `customer.py`: Defines GraphQL types, queries, and mutations related to customers.
*   `savings.py`: Defines GraphQL types, queries, and mutations related to savings accounts.
*   `transaction.py`: Defines GraphQL types, queries, and mutations related to transactions.
*   `loans.py`: Defines Graphql types, queries , and mutations related to transactions.
*   `schema.py`: Aggregates all GraphQL queries and mutations into the main schema.
*   `services/`: Placeholder for business logic services (e.g., `accounting_service.py`, `loan_service.py`).
*   `utils/`: Utility functions.

### Database Schema (Conceptual)

The application uses MongoDB and organizes data into collections:

*   **`users`**: Stores user authentication details (username, hashed password, role).
*   **`customers`**: Stores customer profiles (name, contact info, etc.). Each customer is linked to a user.
*   **`savings`**: Stores details of savings accounts, linked to customers via `user_id`. Accounts can be of different types (regular, high-yield, time deposit).
*   **`transactions`**: Records all financial transactions (deposits, withdrawals) for each savings account.
*   **`ledger_entries`**: Stores financial ledger entries (implementation might be pending).
*   **`loans`**: Stores loan-related information (implementation might be pending).

## Recent Changes & Fixes (by Gemini CLI Agent)

*   **Savings Search Functionality:** Implemented search for savings accounts on the frontend (`js/savings.js`) and backend (`savings.py`, `savings_crud.py`) by account number and customer display name using MongoDB aggregation (`$lookup`).
*   **Backend Import Fixes:** Resolved `ImportError` issues in `main.py` and `customer.py` by ensuring `get_customers_collection`, `get_db`, and `create_indexes` were correctly exposed from `lending-mvp/backend/app/database/__init__.py`.
*   **Database Indexing:** Added `create_indexes` function in `lending-mvp/backend/app/database/__init__.py` to create unique indexes on `emailAddress` for `users` and `customers` collections.
*   **Minimum Balance Enforcement:** Implemented a check in the backend (`transaction_crud.py`) to prevent withdrawals from "regular" savings accounts if the transaction would cause the balance to fall below the defined minimum balance.
*   **`SavingsAccountBase` Subscriptable Error:** Fixed a `TypeError` in `transaction_crud.py` where a `SavingsAccountBase` object was incorrectly treated as a dictionary (`account['balance']` changed to `account.balance`).

This `gemini.md` file provides a foundational understanding of the project. For more detailed information, please refer to the specific source code files.
