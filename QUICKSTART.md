# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Or Python 3.10+ and MongoDB running locally

## Quick Start with Docker

### 1. Navigate to the project
```bash
cd /home/jerome-sabusido/Desktop/Project/financing/lending-mvp
```

### 2. Start the application
```bash
docker-compose up --build
```

### 3. Access the services
- **GraphQL Playground:** http://localhost:8001/graphql
- **Frontend:** http://localhost:8080
- **MongoDB:** localhost:27017

### 4. Sample GraphQL Query
```graphql
query {
  getLoanById(loanId: "12345") {
    borrowerId
    amountRequested
    status
  }
}
```

## Manual Setup (Without Docker)

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Ensure MongoDB is running
```bash
# If using local MongoDB
mongod
```

### 3. Run the backend
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Access GraphQL
Navigate to: http://localhost:8000/graphql

## Common Issues & Solutions

### Issue: Database Connection Failed
**Solution:** 
- Check `.env` file has correct `DATABASE_URL`
- Ensure MongoDB is running
- Verify the connection string format

### Issue: Port Already in Use
**Solution:**
```bash
# Find and kill process using the port
lsof -ti:8001 | xargs kill -9
```

### Issue: ModuleNotFoundError
**Solution:**
- Ensure all `__init__.py` files exist in app packages
- Run `pip install -r requirements.txt` again
- Clear Python cache: `find . -type d -name __pycache__ -exec rm -r {} +`

## Project Structure
```
lending-mvp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connections
│   │   ├── models.py            # Pydantic models
│   │   ├── schema.py            # GraphQL schema
│   │   ├── user.py              # User GraphQL resolvers
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── security.py      # JWT & password handling
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── crud.py          # Database operations
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── loan_service.py  # Loan business logic
│   │       └── accounting_service.py  # Ledger operations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── docker-compose.yml
├── nginx.conf
└── .env
```

## Testing the API

### Create a user (Admin operation)
```graphql
mutation {
  createUser(input: {
    email: "user@example.com"
    username: "testuser"
    fullName: "Test User"
    password: "securepassword"
    role: "user"
  }) {
    success
    message
    user {
      id
      email
      username
    }
  }
}
```

### Login
```graphql
mutation {
  login(input: {
    username: "testuser"
    password: "securepassword"
  }) {
    accessToken
    tokenType
    user {
      id
      email
      username
    }
  }
}
```

### Get all users (Admin operation)
```graphql
query {
  users(skip: 0, limit: 10) {
    success
    message
    users {
      id
      email
      username
      fullName
      role
      isActive
    }
    total
  }
}
```

## Troubleshooting

### View Docker logs
```bash
docker-compose logs -f backend
docker-compose logs -f mongodb
```

### Rebuild containers
```bash
docker-compose down
docker-compose up --build
```

### Remove all Docker containers and volumes
```bash
docker-compose down -v
```

## Support & Contact
For issues or questions, check the `FIXES_SUMMARY.md` file for detailed information about all code fixes.
