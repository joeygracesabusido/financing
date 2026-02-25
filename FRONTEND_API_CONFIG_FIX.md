# Frontend API Configuration Fix - ERR_CONNECTION_REFUSED

## Problem
The frontend was trying to connect to `http://localhost:8001/api-login/` but the backend runs on `http://localhost:8000`, resulting in:
```
POST http://localhost:8001/api-login/ net::ERR_CONNECTION_REFUSED
```

## Root Cause
The frontend's `LoginPage.tsx` uses `import.meta.env.VITE_API_URL` to determine the backend API URL. When this environment variable is not set, it defaults to an empty string `''`, which causes the browser to interpret relative paths incorrectly.

## Solution Applied
Created environment configuration files in `/lending-mvp/frontend-react/`:

### 1. `.env` (Development)
```
VITE_API_URL=http://localhost:8000
```

### 2. `.env.local` (Local Development Override)
```
VITE_API_URL=http://localhost:8000
VITE_GRAPHQL_URL=http://localhost:8000/graphql
```

### 3. `.env.example` (Template for team)
Reference template showing all available configuration options.

## How It Works
1. **Vite Development Server**: Runs on `http://localhost:3000`
2. **Backend API**: Runs on `http://localhost:8000`
3. **Environment Variable**: `VITE_API_URL=http://localhost:8000` tells frontend where backend is
4. **Login Flow**: 
   - Frontend reads `VITE_API_URL` 
   - Constructs full URL: `http://localhost:8000/api-login/`
   - Makes fetch request directly to backend (not through dev server proxy)

## Testing the Fix

### Step 1: Verify Backend is Running
```bash
cd /home/ubuntu/Github/financing/lending-mvp/backend
export SEED_DEMO_DATA=true
python -m uvicorn app.main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Seeding demo data...
```

### Step 2: Verify Frontend Can See Environment Variable
```bash
cd /home/ubuntu/Github/financing/lending-mvp/frontend-react
cat .env
```

Should show:
```
VITE_API_URL=http://localhost:8000
```

### Step 3: Start Frontend (Fresh Terminal)
```bash
cd /home/ubuntu/Github/financing/lending-mvp/frontend-react
npm install  # if needed
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Step 4: Test Login
1. Open browser to `http://localhost:3000/login`
2. Clear browser cache/localStorage (if needed):
   - Press `F12` to open DevTools
   - Go to Application → Storage → localStorage
   - Delete any stored data from localhost
3. Try login with demo credentials:
   - **Username:** `admin`
   - **Password:** `Admin@123Demo`

### Step 5: Verify Network Request
1. Open DevTools (F12)
2. Go to Network tab
3. Click Login button
4. Look for `api-login` request
5. **Should show:** `http://localhost:8000/api-login/` ✅
6. **Status should be:** `200 OK` (not ERR_CONNECTION_REFUSED)

## Demo Credentials
All 6 demo users available for testing:

| Username | Password | Role | Department |
|----------|----------|------|-----------|
| admin | Admin@123Demo | Admin | Management |
| loan_officer | Officer@123Demo | Loan Officer | Lending |
| customer_service | Service@123Demo | Customer Service | Operations |
| auditor | Auditor@123Demo | Auditor | Compliance |
| collector | Collector@123Demo | Collector | Collections |
| branch_manager | Manager@123Demo | Branch Manager | Branch |

## Troubleshooting

### Still Getting ERR_CONNECTION_REFUSED?
1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/docs
   ```
   Should return HTML documentation page.

2. **Check if frontend has `.env` file:**
   ```bash
   ls -la /home/ubuntu/Github/financing/lending-mvp/frontend-react/.env*
   ```
   Should show `.env`, `.env.local`, `.env.example`

3. **Restart frontend dev server:**
   ```bash
   # Press Ctrl+C in frontend terminal
   npm run dev
   ```
   Vite needs to restart to pick up new environment files.

### Getting "Invalid credentials" after fixing connection?
1. Verify demo data was seeded:
   ```bash
   curl http://localhost:8000/graphql -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"{ users { edges { node { username } } } }"}'
   ```
   Should return list of users including 'admin'.

2. Check GraphQL schema camelCase fix is applied:
   ```bash
   grep "strawberry.field(name=" /home/ubuntu/Github/financing/lending-mvp/backend/app/schema.py
   ```
   Should show:
   ```
   full_name: str = strawberry.field(name="fullName")
   is_active: bool = strawberry.field(name="isActive")
   ```

3. Clear browser storage and try again:
   - DevTools → Application → Storage → Clear Site Data
   - Refresh and retry login

### Getting CORS errors?
CORS is already enabled in the backend. If you see CORS errors:
1. Make sure backend is running with `--reload` flag
2. Check backend URL is exactly `http://localhost:8000`
3. Restart both frontend and backend

## Files Modified/Created
- ✅ `/lending-mvp/frontend-react/.env` - Main environment configuration
- ✅ `/lending-mvp/frontend-react/.env.local` - Local development override
- ✅ `/lending-mvp/frontend-react/.env.example` - Template for team

## Architecture Diagram
```
User Browser
    │
    ├─→ http://localhost:3000 (Vite Dev Server - Frontend)
    │         │
    │         └─→ Reads .env file
    │                 │
    │                 └─→ VITE_API_URL=http://localhost:8000
    │
    └─→ Fetch to http://localhost:8000/api-login/ (Backend)
              │
              └─→ POST with credentials
                    │
                    └─→ Returns JWT + User object with camelCase fields
                        (Fixed by schema.py Strawberry mappings)
```

## Next Steps After Successful Login
1. Dashboard should load with demo data
2. Test different user roles by logging in with other credentials
3. Explore loan products, customers, and transactions
4. Check audit logs for activity tracking
5. Review demo data in backend MongoDB/PostgreSQL

## Important Notes
- **Keep `.env` in git repository** - all developers need same local development setup
- **Production:** Use `.env.production` or environment variables when deploying
- **NEVER commit sensitive data** to `.env` - use `.env.example` for templates only
- **Backend port:** If you change backend port, update `VITE_API_URL` accordingly
- **Frontend dev server:** Always runs on `http://localhost:3000` for development

---

**Status:** ✅ Fixed - Frontend now has correct API URL configuration
**Last Updated:** 2026-02-20
