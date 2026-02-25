# 🚀 Step-by-Step: Getting Frontend Login Working

## The Issue (Explained Simply)

```
Frontend says: "I need fullName and isActive"
Backend says: "I'm sending full_name and is_active"
Result: ❌ Login fails (data doesn't match)

After Fix:
Backend now says: "I'm sending fullName and isActive"
Result: ✅ Login works!
```

---

## Step-by-Step Fix

### STEP 1: Verify the Fix is Applied

Check that `schema.py` was updated correctly:

```bash
cd lending-mvp/backend/app
grep -A 5 "class UserType:" schema.py
```

You should see:
```python
class UserType:
    id: strawberry.ID
    email: str
    username: str
    full_name: str = strawberry.field(name="fullName")
    is_active: bool = strawberry.field(name="isActive")
```

✅ If you see `strawberry.field(name="fullName")` → Fix is applied!

---

### STEP 2: Start Backend with Demo Data

```bash
# Navigate to backend
cd lending-mvp/backend

# Enable demo data
export SEED_DEMO_DATA=true

# Start server
python -m uvicorn app.main:app --reload
```

**Expected output:**
```
🌱 Seeding demo data...
  ✓ Created user: admin (admin)
  ✓ Created user: loan_officer_1 (loan_officer)
  ✓ Created user: loan_officer_2 (loan_officer)
  ✓ Created user: teller_1 (teller)
  ✓ Created user: branch_manager (branch_manager)
  ✓ Created user: auditor (auditor)
Users seeded: 6 new records
...more records...
Customers seeded: 7 new records
...
✅ Demo data seeded successfully

INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Wait for:** `✅ Demo data seeded successfully` message

---

### STEP 3: Verify Backend Health

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "ok"}
```

✅ Backend is running!

---

### STEP 4: Test GraphQL Login

Open in browser: **http://localhost:8000/graphql**

Paste this query:
```graphql
query {
  users(skip: 0, limit: 1) {
    users {
      id
      username
      fullName
      isActive
      role
    }
  }
}
```

Click play (▶️)

**Expected response:**
```json
{
  "data": {
    "users": {
      "users": [
        {
          "id": "507f1f77bcf86cd799439011",
          "username": "admin",
          "fullName": "Administrator",    ← camelCase ✓
          "isActive": true,               ← camelCase ✓
          "role": "admin"
        }
      ]
    }
  }
}
```

✅ GraphQL schema is returning camelCase!

---

### STEP 5: Test REST Login

```bash
curl -X POST http://localhost:8000/api-login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123Demo"}'
```

**Expected response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@lending.demo",
    "fullName": "Administrator",      ← camelCase ✓
    "isActive": true,                 ← camelCase ✓
    "role": "admin"
  }
}
```

✅ REST API is returning camelCase!

---

### STEP 6: Ensure Frontend is Running

In another terminal:

```bash
cd lending-mvp/frontend-react
npm run dev
```

Should show:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173
  ➜  press h + enter to show help
```

✅ Frontend is running on port 5173

---

### STEP 7: LOGIN via Frontend! 🎉

1. Open browser: **http://localhost:3010/login**
   (Or: http://localhost:5173/login if using Vite port)

2. Fill login form:
   ```
   Username: admin
   Password: Admin@123Demo
   ```

3. Click **"Sign In"** button

4. **Should redirect to Dashboard!** 

✅ **Success!** 🎉

---

## If Login Still Fails

### Troubleshooting Checklist

**❌ See error: "Cannot find user"**
- Check demo data was seeded (see STEP 2 logs)
- Verify backend shows: `✅ Demo data seeded successfully`
- If not, restart with `export SEED_DEMO_DATA=true`

**❌ See error: "Incorrect username or password"**
- Double-check credentials:
  - Username: `admin` (not `Admin` or `ADMIN`)
  - Password: `Admin@123Demo` (with capital A and capital D)
- Check password matches exactly

**❌ See error: "Request failed"**
- Check backend is running: `curl http://localhost:8000/health`
- Check frontend API URL in devtools (F12 → Network tab)
- Should call `http://localhost:8000/api-login/` not `http://localhost:3010/`

**❌ See error: "User data missing fields"**
- Clear browser cache: `F12 → Application → Clear Site Data`
- Restart browser
- Try login again
- Should now have `fullName` and `isActive`

**❌ GraphQL shows old schema (snake_case)**
- Clear GraphQL cache: In GraphQL playground, menu → Settings → Cache → Clear
- Or hard refresh: `Ctrl+Shift+R` on GraphQL page
- Re-run query

---

## Demo Credentials to Test

Once logged in, try other roles:

```
Admin:          admin / Admin@123Demo
Loan Officer:   loan_officer_1 / LoanOfficer@123
Teller:         teller_1 / Teller@123Demo
Manager:        branch_manager / BranchMgr@123
Auditor:        auditor / Auditor@123Demo
```

Each role has different dashboard and permissions!

---

## Commands Quick Reference

```bash
# Start backend with demo data
export SEED_DEMO_DATA=true
cd lending-mvp/backend
python -m uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd lending-mvp/frontend-react
npm run dev

# Test backend health
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/api-login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123Demo"}'

# Clear browser data
# Open DevTools (F12) → Application → Clear Site Data
```

---

## Success Indicators ✅

When everything is working:

- [x] Backend logs show "Demo data seeded successfully"
- [x] GraphQL query returns `fullName` (camelCase)
- [x] REST login returns `fullName` (camelCase)
- [x] Frontend login redirects to dashboard
- [x] Dashboard shows user name and role
- [x] Can click different pages (Customers, Loans, etc.)
- [x] Logout works and redirects to login

---

## What's Next?

Once logged in:

1. **Explore Dashboard** → See system overview
2. **View Customers** → See 7 demo customers
3. **View Loans** → See 4 sample loans
4. **View Savings** → See 16 savings accounts
5. **Check Audit Logs** → See 18+ logged actions
6. **Try Different Roles** → Test permissions

---

## Support

**For more details:**
- See: `LOGIN_FIX_SUMMARY.md` (this fix explained)
- See: `FRONTEND_LOGIN_FIX.md` (technical details)
- See: `FRONTEND_LOGIN_FIXED.md` (implementation guide)
- See: `DEMO_DATA_SETUP_GUIDE.md` (demo data usage)

---

**Last Update:** February 20, 2026  
**Status:** ✅ Ready to Test!

Go ahead and try logging in now! 🚀
