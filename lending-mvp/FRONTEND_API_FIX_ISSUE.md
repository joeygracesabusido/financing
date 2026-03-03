# Frontend API Integration Issue

**Date:** March 3, 2026  
**Status:** ⚠️ **BLOCKED** - Backend Not Fully Converted to REST API

---

## Problem Summary

The frontend is configured to use Apollo Client with GraphQL, but the backend is a FastAPI REST API. When the frontend tries to connect, it gets 404 errors because:

1. Frontend expects GraphQL endpoint at `/graphql`
2. Backend uses REST API with endpoints like `/api-login/`, `/api/users`, etc.
3. Backend only has `/api-login/` registered - all other routes are missing

---

## Root Causes

### 1. Backend Not Fully Converted to REST
Many backend files still use MongoDB imports and are not compatible with PostgreSQL-only setup:

- `backend/app/customer.py` - Uses `get_customers_collection()` (MongoDB)
- `backend/app/loan.py` - Uses MongoDB functions
- `backend/app/savings.py` - Uses MongoDB functions
- `backend/app/transaction.py` - Uses MongoDB functions
- Many other files have similar issues

### 2. Routes Not Registered
The `main.py` only includes `login_endpoint` router. All other routers need to be imported and registered.

### 3. Frontend Uses GraphQL
The frontend is configured with Apollo Client for GraphQL, but the backend doesn't have a GraphQL server.

---

## Current State

### Backend Routes (Only `/api-login/` works)
```
POST  /api-login/
GET   /
GET   /health
GET   /docs
GET   /openapi.json
```

### Frontend Configuration
- Apollo Client configured for GraphQL
- Trying to connect to `/graphql` endpoint
- Getting 404 errors

---

## Required Fixes

### Option 1: Convert Backend to REST API (Recommended)

1. **Update all backend files** to use PostgreSQL instead of MongoDB
2. **Register all routers** in `main.py`
3. **Test all endpoints** work correctly

**Files to update:**
- `backend/app/customer.py`
- `backend/app/loan.py`
- `backend/app/savings.py`
- `backend/app/transaction.py`
- `backend/app/aml_compliance.py`
- And many more...

**Estimated Effort:** 2-3 days

### Option 2: Add GraphQL Server to Backend

1. **Add GraphQL endpoint** using Apollo Server or Strawberry
2. **Convert existing REST endpoints** to GraphQL queries
3. **Update frontend** to use GraphQL

**Estimated Effort:** 1-2 days

### Option 3: Convert Frontend to REST API

1. **Remove Apollo Client**
2. **Create REST API client** using `fetch` or `axios`
3. **Update all components** to use REST endpoints

**Estimated Effort:** 1-2 days

---

## Quick Fix (Temporary)

Until the backend is fully converted, you can:

1. **Test login endpoint** manually:
   ```bash
   curl -X POST http://localhost:8001/api-login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"Admin@123Demo"}'
   ```

2. **Check backend logs** for errors:
   ```bash
   docker logs lending_backend
   ```

3. **Verify database tables** exist:
   ```bash
   docker exec lending_postgres psql -U lending_user -d lending_db -c "\dt"
   ```

---

## Next Steps

### Immediate
1. **Fix backend imports** - Remove MongoDB dependencies
2. **Register all routers** - Import all routers in `main.py`
3. **Test endpoints** - Verify all REST endpoints work

### Short-term
1. **Choose option** - REST conversion, GraphQL, or REST frontend
2. **Implement fix** - Convert backend or frontend
3. **Test integration** - Verify frontend-backend communication

### Long-term
1. **Full migration** - Complete backend conversion to PostgreSQL
2. **API documentation** - Complete Swagger/OpenAPI documentation
3. **Integration tests** - Add E2E tests for all features

---

## Current Workarounds

### Manual API Testing
```bash
# Login
curl -X POST http://localhost:8001/api-login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123Demo"}'

# Health check
curl http://localhost:8001/health

# API docs
curl http://localhost:8001/docs
```

### Frontend Configuration
The frontend is configured with:
- `VITE_API_URL: http://localhost:8001`
- `VITE_GRAPHQL_URL: /api`

But the backend doesn't have `/api` routes registered.

---

## Summary

**The frontend cannot connect because the backend is not fully converted to a REST API.** Many backend files still use MongoDB, and only the login endpoint is registered.

**To fix this issue, the backend needs to be fully converted to use PostgreSQL and all routes need to be registered.**

**Estimated time to fix:** 2-3 days

---

**END OF ISSUE REPORT**
