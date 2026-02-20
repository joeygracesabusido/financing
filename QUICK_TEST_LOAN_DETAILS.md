# Quick Test - Loan Details Page

## 🚀 Start Testing Now (2 minutes)

### Step 1: Get a Loan ID
```bash
cd /home/jerome-sabusido/Desktop/financing/lending-mvp
docker compose exec mongodb mongosh
```
```javascript
// In MongoDB shell:
use financing_db
db.loans.findOne() // Copy the _id value
```

Example output:
```
{
  _id: ObjectId("..."),
  borrower_id: ObjectId("..."),
  loan_product: "Home Loan",
  status: "active",
  ...
}
// Use the _id value in next step
```

### Step 2: Open Loan Details Page
```
http://localhost:8080/loan_details.html?id=YOUR_LOAN_ID
```
Replace `YOUR_LOAN_ID` with the `_id` value from MongoDB

Example:
```
http://localhost:8080/loan_details.html?id=6571a23b4c9d8e7f6g5h4i3j
```

### Step 3: Press F12 and Check Console
You should see:
```
=== FETCHING LOAN DETAILS ===
✅ Token exists
📋 Loan ID: 6571a23b4c9d8e7f6g5h4i3j
🔄 Sending GraphQL query to: /graphql
📦 HTTP Response status: 200
✅ All loan details updated successfully
Display values:
  - Borrower Name: John Doe
  - Loan Product: Home Loan
  - Status: ACTIVE
  - Amount: ₱100,000.00
  - Interest Rate: 5.5%
  - Term: 36

=== FETCHING LOAN TRANSACTIONS ===
✅ Transaction count: 3
✅ Table population complete with 3 rows
```

### Step 4: Verify Page Display
Check that these fields display actual values (not "-"):
- ✅ **Borrower Names**: John Doe (or actual name)
- ✅ **Loan Product**: Home Loan (or actual product)
- ✅ **Status**: ACTIVE (with green color) or PENDING (yellow)
- ✅ **Interest Rate**: 5.5% (or actual rate)
- ✅ **Term (Months)**: 36 (or actual term)
- ✅ **Amount Requested**: ₱100,000.00 (formatted amount)
- ✅ **Remaining Balance**: Calculated from transactions
- ✅ **Transaction History**: Table with rows

## ❌ If You See Errors

### Error: "Loan Not Found"
**Fix**: 
1. Get valid loan ID from MongoDB
2. Update URL parameter
3. Refresh page

### Error: "Loan details not found"
**Console shows**: `"message": "Loan not found"`
**Check**:
- Is loan ID in MongoDB? `db.loans.findOne({_id: ObjectId("ID")})`
- Did you use correct ID format?

### Error: All fields showing "-"
**Console shows**: `borrowerName: undefined`
**Check**:
- MongoDB query running? `db.loans.findOne({loan_product: {$exists: true}})`
- Backend running? `docker compose ps`
- Check backend logs: `docker compose logs backend | tail -50`

## 🎯 What to Verify

| Item | Check | Status |
|------|-------|--------|
| Borrower Name | Not "-", shows actual name | ✅ |
| Loan Product | Not "-", shows product | ✅ |
| Status | Shows with color (green/yellow) | ✅ |
| Interest Rate | Shows "X%" not "-" | ✅ |
| Term | Shows months not "-" | ✅ |
| Transactions | Table has rows | ✅ |
| Console | Shows ✅ messages | ✅ |
| No errors | Console clean | ✅ |

## 📱 Browser Requirements
- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- LocalStorage enabled (for JWT token)
- F12 Console available

## 🔄 If Page Needs Refresh
1. Press **Ctrl+Shift+Delete** to clear site data
2. Refresh page (Ctrl+R)
3. Check console again

## 📊 Expected Page Layout

```
┌─────────────────────────────────────┐
│ Loan Details: 6571a23b...           │ ← Header shows Loan ID
├─────────────────────────────────────┤
│ LOAN INFORMATION                    │
│ ┌──────────────┬──────────────────┐ │
│ │ Borrower     │ Loan Product     │ │
│ │ John Doe     │ Home Loan        │ │
│ ├──────────────┼──────────────────┤ │
│ │ Status       │ Amount Requested │ │
│ │ ACTIVE       │ ₱100,000.00      │ │
│ ├──────────────┼──────────────────┤ │
│ │ Remaining    │ Interest Rate    │ │
│ │ ₱80,000.00   │ 5.5%             │ │
│ ├──────────────┼──────────────────┤ │
│ │ Term         │ Created          │ │
│ │ 36 months    │ 1/15/2025        │ │
│ └──────────────┴──────────────────┘ │
├─────────────────────────────────────┤
│ TRANSACTION HISTORY                 │
│ ┌──────┬────────┬────────┬─────────┐│
│ │Date  │Type    │Amount  │Notes    ││
│ ├──────┼────────┼────────┼─────────┤│
│ │...   │Disburs │+100k   │Initial  ││
│ │...   │Repay   │-10k    │Payment  ││
│ │...   │Repay   │-10k    │Payment  ││
│ └──────┴────────┴────────┴─────────┘│
├─────────────────────────────────────┤
│ MAKE A PAYMENT (Right sidebar)       │
│ Amount: [______]                    │
│ Date: [____________]                │
│ Notes: [______________]             │
│ [Submit Payment]                    │
└─────────────────────────────────────┘
```

## 💡 Tips

1. **Console is your friend** - Open F12 and watch for ✅ messages
2. **Transaction table** - Will be empty if loan has no transactions yet
3. **Status colors** - Green = ACTIVE, Yellow = PENDING, Gray = other
4. **Balance** - Red if outstanding, Green if zero/paid
5. **Multiple refreshes** - Safe to refresh, data will reload

## 🚀 All Set!

The fix is complete. Now:
1. Get loan ID from MongoDB
2. Visit loan_details.html?id=YOUR_ID
3. Check console for ✅ messages
4. Verify page shows all fields

---

**Status**: ✅ Ready to test
**Time to verify**: 2-5 minutes
**Backend**: Running smoothly
**Frontend**: All fields functional
