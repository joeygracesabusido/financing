# 🐛 Frontend Login Issue — Diagnosis & Solution

## Problem

Users cannot login via the React frontend at `http://localhost:3010/login` with demo credentials.

## Root Cause Analysis

### 1. **Field Naming Mismatch**

**Frontend expects** (`AuthContext.tsx`):
```typescript
export interface AuthUser {
    id: string
    username: string
    email: string
    fullName: string        // ← camelCase
    isActive: boolean       // ← camelCase
    role: string
}
```

**Backend returns** (GraphQL `UserType`):
```python
@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str          # ← snake_case
    is_active: bool         # ← snake_case
    role: str
```

### 2. **REST API Endpoint Response**

The `/api-login/` endpoint returns data from GraphQL mutation:
```graphql
mutation Login($username: String!, $password: String!) {
    login(input: {username: $username, password: $password}) {
        accessToken
        tokenType
        refreshToken
        user {
            id
            username
            email
            fullName           # ← This is being returned as full_name
            isActive           # ← This is being returned as is_active
            role
        }
    }
}
```

When the GraphQL engine serializes `UserType`, it converts field names to snake_case because Strawberry uses Python naming conventions.

### 3. **The Flow**

```
React Login Form
       ↓
POST /api-login/ {username, password}
       ↓
FastAPI executes GraphQL mutation
       ↓
GraphQL returns user with full_name, is_active (snake_case)
       ↓
Frontend expects fullName, isActive (camelCase)
       ↓
❌ Login fails - user data doesn't match interface
```

## Solutions

### Solution 1: Fix GraphQL Schema (Recommended) ✅

Use Strawberry's `field(name=...)` to map to camelCase:

```python
@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str = strawberry.field(name="fullName")    # Map to fullName
    is_active: bool = strawberry.field(name="isActive")   # Map to isActive
    role: str
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")
```

**Pros:**
- ✅ Clean GraphQL schema (standard camelCase)
- ✅ No frontend changes needed
- ✅ Consistent with GraphQL conventions
- ✅ Works with all clients

**Cons:**
- Need to update schema.py

### Solution 2: Fix Frontend (NOT Recommended) ❌

Change frontend to use snake_case:

```typescript
export interface AuthUser {
    id: string
    username: string
    email: string
    full_name: string        // ← Change to snake_case
    is_active: boolean       // ← Change to snake_case
    role: string
}
```

**Pros:**
- ✅ Quick fix
- ✅ No backend changes

**Cons:**
- ❌ Non-standard naming in TypeScript
- ❌ Inconsistent with React conventions
- ❌ Would need to change everywhere in frontend

### Solution 3: Middleware Conversion

Add middleware to convert response fields:

```python
# In main.py
@app.post("/api-login/")
async def api_login(login_request: LoginRequest):
    # ... existing code ...
    data = result.data["login"]
    
    # Convert snake_case to camelCase
    data["user"] = {
        "id": data["user"]["id"],
        "username": data["user"]["username"],
        "email": data["user"]["email"],
        "fullName": data["user"]["full_name"],      # Convert
        "isActive": data["user"]["is_active"],      # Convert
        "role": data["user"]["role"],
    }
    return data
```

**Pros:**
- ✅ Frontend works without changes
- ✅ No schema changes needed

**Cons:**
- ❌ Adds conversion logic to backend
- ❌ Brittle and hard to maintain
- ❌ Not GraphQL standard

---

## Recommended Fix: Solution 1

### Implementation Steps

#### Step 1: Update `schema.py`

Replace the UserType definition to use Strawberry field names:

```python
@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str = strawberry.field(name="fullName")
    is_active: bool = strawberry.field(name="isActive")
    role: str
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")
```

#### Step 2: Restart Backend

```bash
cd lending-mvp/backend
python -m uvicorn app.main:app --reload
```

#### Step 3: Test Login

```bash
curl -X POST http://localhost:8000/api-login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123Demo"}'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "tokenType": "bearer",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@lending.demo",
    "fullName": "Administrator",        // ← Now camelCase!
    "isActive": true,                   // ← Now camelCase!
    "role": "admin"
  }
}
```

#### Step 4: Login via Frontend

- Go to `http://localhost:3010/login`
- Username: `admin`
- Password: `Admin@123Demo`
- ✅ Should login successfully!

---

## Demo Credentials (Once Fixed)

| Role | Username | Password |
|------|----------|----------|
| 🔐 Admin | admin | Admin@123Demo |
| 💼 Loan Officer | loan_officer_1 | LoanOfficer@123 |
| 💳 Teller | teller_1 | Teller@123Demo |
| 👔 Branch Manager | branch_manager | BranchMgr@123 |
| 👁️ Auditor | auditor | Auditor@123Demo |

---

## Additional Issues to Check

After fixing the schema, also verify:

1. **Backend is seeding demo users**
   - Check: `echo $SEED_DEMO_DATA` should be `true`
   - Restart backend: `python -m uvicorn app.main:app --reload`
   - Check logs for demo data seeding messages

2. **Frontend API URL is correct**
   - Check: `vite.config.ts` or `.env` for `VITE_API_URL`
   - Should point to `http://localhost:8000` (not 8080 or other port)

3. **CORS is enabled**
   - Backend should have `allow_origins=["*"]` in CORSMiddleware
   - Check: `main.py` around line 183

4. **GraphQL introspection works**
   - Try: `http://localhost:8000/graphql`
   - Run GraphQL query to verify schema

---

## Testing Checklist

- [ ] Update `schema.py` with camelCase field names
- [ ] Restart backend with demo data seeding
- [ ] Verify demo users were created (check logs)
- [ ] Test GraphQL introspection at `/graphql`
- [ ] Test login via REST endpoint: `/api-login/`
- [ ] Test login via React frontend at `http://localhost:3010/login`
- [ ] Verify user data in localStorage
- [ ] Check different user roles work

---

## Quick Fix Command

If you want to see the exact change needed:

```bash
cd lending-mvp/backend/app
grep -n "class UserType:" schema.py
# Shows line number of UserType definition
# Then edit that section to add strawberry.field(name="...") mappings
```

---

*Generated: February 20, 2026*
