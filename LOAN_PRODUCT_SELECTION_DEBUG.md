# Loan Product Selection - Complete Debug Guide

**Issue**: "Loan product not found" error when selecting loan product

**Version**: 1.0.6 (Enhanced matching + debugging)

---

## What Was Fixed

### Problem Analysis
The original datalist selection was failing silently. The improvements made:

1. **Better product matching logic**
   - Checks if datalist has products loaded
   - Lists all available options with their IDs
   - Tries exact match first
   - Falls back to partial match if needed
   - Provides detailed debugging at each step

2. **Multiple event triggers**
   - `change` event - when user selects from dropdown
   - `blur` event - when user leaves the field (catches missed selections)

3. **Enhanced error handling**
   - Logs HTTP response status
   - Logs GraphQL errors from backend
   - Shows data structure if product not found
   - Distinguishes between loading, matching, and API errors

---

## Step-by-Step Testing

### Step 1: Clear Browser Cache (CRITICAL!)
```
Press: Ctrl+Shift+Delete
Check: "Cookies and other site data" 
Check: "Cached images and files"
Click: "Clear data"
```

**Why?** Old JavaScript version cached in browser will prevent new code from running.

### Step 2: Open Developer Console
```
Press: F12
Click: "Console" tab
Clear previous logs with X button
```

### Step 3: Refresh the Page
```
Press: Ctrl+Shift+R (hard refresh)
Look for: ✅ Loaded X loan products
Look for: List of products with their IDs
```

**What you should see:**
```
✅ Loaded 3 loan products
  ✅ Added product: Home Loan (ID: 507f4eb5c3b2a1e5d8c2a9f1)
  ✅ Added product: Auto Loan (ID: 507f4eb5c3b2a1e5d8c2a9f2)
  ✅ Added product: Personal Loan (ID: 507f4eb5c3b2a1e5d8c2a9f3)
```

**If empty list?**
- Backend not returning loan products
- Check Network tab (F12 → Network)
- Look for `getAllLoanProducts` GraphQL response
- Verify backend is running: `python -m uvicorn app.main:app --reload`

### Step 4: Interact with Loan Product Field

**Action 1: Type in the field**
```
Click on: "Loan Product" input field
Type: "Home" (partial text)
```

**What you'll see in console:**
```
🔄 Loan product input changed
```

**Action 2: Select from dropdown**
```
Look for: Dropdown list appearing
Click on: "HL001 - Home Loan" option
```

**What you'll see in console:**
```
🔍 Searching for loan product: "HL001 - Home Loan"
📊 Total options available: 3
Available options:
[0] value="HL001 - Home Loan" id="507f4eb5c3b2a1e5d8c2a9f1"
[1] value="AL001 - Auto Loan" id="507f4eb5c3b2a1e5d8c2a9f2"
[2] value="PL001 - Personal Loan" id="507f4eb5c3b2a1e5d8c2a9f3"
✅ Found exact match for product: "HL001 - Home Loan"
✅ Product ID: 507f4eb5c3b2a1e5d8c2a9f1
```

### Step 5: Watch the Auto-Population

**Expected console output:**
```
📝 Loan product field changed: HL001 - Home Loan
✅ Loan product ID retrieved: 507f4eb5c3b2a1e5d8c2a9f1
📋 Fetching loan product details for ID: 507f4eb5c3b2a1e5d8c2a9f1
📦 Loan Product Response: {data: {loanProduct: {id: "507f4eb5c3b2a1e5d8c2a9f1", ...}}}
✅ Auto-populating loan product fields
   Product: Home Loan (HL001)
  ✅ Term Months: 36
  ✅ Interest Rate: 5.50%
✅ Loan product details populated successfully
```

**Expected form changes:**
- ✅ Terms (Months) field shows: `36`
- ✅ Interest Rate (%) field shows: `5.50`

---

## Troubleshooting

### Issue 1: "No product found matching..."

**Symptom**
```
🔍 Searching for loan product: "Some Product"
📊 Total options available: 3
Available options:
[0] value="HL001 - Home Loan" id="..."
[1] value="AL001 - Auto Loan" id="..."
[2] value="PL001 - Personal Loan" id="..."
❌ No product found matching: "Some Product"
```

**Cause**: User typed text that doesn't match any product

**Solution**: 
1. Clear the field completely
2. Click and let dropdown appear
3. Click on a product from the list (don't type)
4. Fields should auto-populate

---

### Issue 2: "Datalist is empty"

**Symptom**
```
🔍 Searching for loan product: "..."
📊 Total options available: 0
❌ Datalist is empty - products not loaded
```

**Cause**: Loan products not loaded from backend

**Solutions**:

**Option 1: Backend issue**
```bash
# Check if backend is running
ps aux | grep uvicorn

# If not running, start it
cd /path/to/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Restart if already running
pkill -f uvicorn
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Option 2: Check database**
```bash
# Verify loan products exist in database
# Use MongoDB Compass or mongo shell
mongo
use lending_database
db.loanproducts.find({}).pretty()
```

**Option 3: Clear browser cache again**
```
Ctrl+Shift+Delete → Clear all → Refresh
```

---

### Issue 3: GraphQL error response

**Symptom**
```
📦 Loan Product Response: {errors: [{message: "Invalid ID format"}]}
❌ GraphQL Errors: [...]
```

**Cause**: Backend API not recognizing the product ID format

**Solutions**:
1. Check Network tab (F12 → Network)
2. Click on GraphQL request
3. Check "Response" section
4. Look for error message
5. Report full error to backend team

---

### Issue 4: Fields populate but with wrong values

**Symptom**
```
✅ Interest Rate: NaN%
⚠️ Could not extract term from: "null"
```

**Cause**: Backend returning null/empty values for term or rate

**Solutions**:
1. Check loan product in database
2. Verify `termType` field has format like "12 months"
3. Verify `defaultInterestRate` field has numeric value
4. Update loan product if needed

---

## Console Message Reference

| Message | Meaning | Action |
|---------|---------|--------|
| ✅ Loaded X loan products | Success! Products loaded | Continue testing |
| ❌ Datalist is empty | No products in database | Check backend |
| 🔍 Searching for... | Starting product lookup | Check next message |
| 📊 Total options available | How many products loaded | Should be > 0 |
| ✅ Found exact match | Product found! | Proceed to API call |
| ❌ No product found matching | Mismatch in dropdown | Select from list |
| 📋 Fetching product details | Calling backend GraphQL | Wait for response |
| ❌ HTTP Error | Network problem | Check Network tab |
| ❌ GraphQL Errors | Backend error | Check error message |
| ✅ Auto-populating fields | Fields being filled | Check form inputs |
| ⚠️ Could not extract term | Term format wrong | Check database |
| ✅ Loan product populated | SUCCESS! | Ready to submit |

---

## Network Debugging (F12 → Network)

### Check 1: GraphQL Requests
1. Open Network tab
2. Perform selection
3. Look for requests to `/graphql`
4. Click the GraphQL request
5. Check "Response" tab for:
   - ✅ `"success": true` 
   - ✅ `"loanProduct"` object with data
   - ❌ `"errors"` array (bad)

### Check 2: Response Format
```json
// GOOD response
{
  "data": {
    "loanProduct": {
      "id": "507f4eb5c3b2a1e5d8c2a9f1",
      "productCode": "HL001",
      "productName": "Home Loan",
      "termType": "36 months",
      "defaultInterestRate": 5.5
    }
  }
}

// BAD response
{
  "errors": [
    {"message": "Product not found"}
  ]
}
```

---

## Quick Reference Commands

### Restart Backend
```bash
pkill -f uvicorn
cd /path/to/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Check Logs
```bash
# Real-time logs
tail -f backend.log

# GraphQL query logs
grep -i "getloanproduct" backend.log
```

### Test GraphQL Directly
Using browser console:
```javascript
const query = `
  query GetLoanProduct($id: ID!) {
    loanProduct(id: $id) {
      id, productCode, productName, termType, defaultInterestRate
    }
  }
`;

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    query: query,
    variables: { id: "507f4eb5c3b2a1e5d8c2a9f1" }
  })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
```

---

## Success Checklist

✅ Cache cleared (Ctrl+Shift+Delete)
✅ Hard refresh done (Ctrl+Shift+R)
✅ Console shows products loaded
✅ Loan Product field displays dropdown
✅ Can select product from dropdown
✅ Console shows "Found exact match"
✅ Console shows "Product ID retrieved"
✅ Terms field auto-fills with number
✅ Interest Rate field auto-fills with decimal
✅ No red errors in console
✅ Ready to submit form

---

## Still Having Issues?

1. **Screenshot console** - Take F12 screenshot
2. **Note the exact error** - Copy full error message
3. **Check Network tab** - Look at GraphQL response
4. **Check backend logs** - Look for server-side errors
5. **Verify database** - Confirm loan products exist
6. **Try fresh browser** - Use incognito window
7. **Report with details** - Include all above info

---

## Technical Details

### How It Works
1. Page loads → Fetch all loan products → Populate datalist options
2. User selects product → Trigger change/blur event
3. Get selected product ID → Fetch product details from backend
4. Parse term and interest rate → Fill form fields
5. User continues with remaining form fields → Submit

### Why Multiple Events?
- `change` - Browser native datalist selection
- `blur` - Catches if user finishes typing but doesn't click

### Partial Match Fallback
If user types "Home" but datalist shows "HL001 - Home Loan":
- Exact match fails
- Partial match finds it
- Auto-population proceeds

---

**Version**: 1.0.6
**Last Updated**: Feb 21, 2026
**Cache Buster**: Check first line of create_loan_transaction.js
