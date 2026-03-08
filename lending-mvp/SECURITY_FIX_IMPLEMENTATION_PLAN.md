# Security Fix Implementation Plan
# ===================================
# Date: March 8, 2026
# Project: Lending MVP

## EXECUTIVE SUMMARY

This document outlines the implementation plan to complete all security fixes identified in the branch security analysis.

---

## PHASE 1: Verification & Testing (Current Priority)

### 1.1 Verify transaction.py Syntax and Structure
**Action:** Check that the modified transaction.py file has valid syntax

**Commands:**
```bash
cd ~/Github/financing/lending-mvp
python3 -m py_compile backend/app/transaction.py
echo "Syntax check: $?
```

### 1.2 Check Application Can Start
**Action:** Verify the backend can start without errors

**Commands:**
```bash
cd ~/Github/financing/lending-mvp
python3 -c "import sys; sys.path.insert(0, '.'); from backend.app.transaction import TransactionQuery, Mutation; print('Import successful')"
```

### 1.3 Manual Testing Scenarios

#### Test Scenario A: Customer Access (Should Work)
**Steps:**
1. Login as customer_demo
2. Navigate to transactions page
3. Verify you can see your own account transactions
4. Verify you cannot see other customers' transactions

**Expected Result:** ✅ Success - Customer sees only their own transactions

#### Test Scenario B: Loan Officer Access (Should Be Restricted)
**Steps:**
1. Login as loan_officer_1 (HQ branch)
2. Navigate to transactions page
3. Verify you can ONLY see HQ customer transactions
4. Verify you CANNOT see BR-QC or other branch transactions

**Expected Result:** ✅ Only HQ data visible, cross-branch blocked

#### Test Scenario C: Teller Access (Should Be Restricted)
**Steps:**
1. Login as teller_1 (BR-CDO branch)
2. Navigate to savings/transactions page
3. Verify you can ONLY see BR-CDO customers' transactions
4. Verify cross-branch access is denied

**Expected Result:** ✅ Only CDO branch data visible

---

## PHASE 2: Savings Module Standardization (High Priority)

### 2.1 Identify All Files Using `assigned_branch`
**Action:** Search for inconsistent field usage across the codebase

**Command:**
```bash
grep -r "assigned_branch" backend/app/ --include="*.py"
```

### 2.2 Standardize to `branch_code`
**Action:** Replace all `assigned_branch` references with `branch_code` in savings module

**Files to Modify:**
- `backend/app/savings.py`
- Any CRUD modules referencing savings

### 2.3 Verify Branch Consistency
**Action:** Ensure both fields point to the same data after migration

---

## PHASE 3: Audit Logging Verification (Medium Priority)

### 3.1 Set Up Log Monitoring
**Action:** Configure log collection if not already done

**Commands:**
```bash
tail -f ~/logs/app.log  # Or wherever your logs are stored
# OR check application output:
python3 backend/main.py 2>&1 | grep "AUDIT_LOG"
```

### 3.2 Trigger Audit Events
**Action:** Perform actions that should trigger audit logging

**Test Actions:**
1. Attempt to view transactions from another branch (should log denial)
2. Attempt to create transaction on another customer's account (should log denial)
3. Attempt fund transfer across branches (should log denial)

### 3.3 Verify Log Entries
**Expected Format:**
```
AUDIT_LOG:user_id|action|details|success
```

---

## PHASE 4: Run Full Test Suite (Critical Priority)

### 4.1 E2E Tests for Branch Isolation
**Files to Update:** `e2e-tests/` or appropriate test directory

**Add These Test Cases:**

```typescript
describe('Branch Access Control', () => {
    test('P5-001: Loan officer sees only HQ loans', async ({ page }) => {
        await login(page, 'loan_officer_1');
        await page.goto('/loans');
        const loans = page.locator('.loan-list').allTextContents();
        expect(loans).not.toContain('BR-QC'); // Cannot see other branches
    });

    test('P5-002: Teller sees only CDO savings', async ({ page }) => {
        await login(page, 'teller_1');
        await page.goto('/savings');
        const savings = page.locator('.savings-list').allTextContents();
        expect(savings).toContain('BR-CDO');
        // Verify no other branches appear
    });

    test('P5-003: Customer sees only own transactions', async ({ page }) => {
        await login(page, 'customer_demo');
        await page.goto('/transactions');
        const transactions = page.locator('.transaction-list').allTextContents();
        expect(transactions).toContain('My Account');
    });

    test('P5-004: Staff cannot create transaction on other account', async ({ page }) => {
        await login(page, 'loan_officer_1');
        await page.goto('/transactions/create');
        // This should fail with "Access denied" message
    });
});
```

### 4.2 Run Tests
```bash
cd ~/Github/financing/lending-mvp
cd e2e-tests
npm test -- --grep "Branch Access"
# OR if using Playwright:
npx playwright test --grep "Branch"
```

---

## PHASE 5: Logging & Monitoring Setup

### 5.1 Verify Log Destination
**Action:** Confirm where application logs are being written

**Check:**
```bash
# Check if logs directory exists
ls -la ~/logs/
# OR check application config for log path
grep -r "LOG" backend/app/ --include="*.py"
```

### 5.2 Set Up Log Rotation (Production)
**Action:** Configure logrotate if deploying to production

---

## IMMEDIATE ACTIONS REQUIRED

### Action 1: Verify Current State
```bash
cd ~/Github/financing/lending-mvp

# Check syntax
python3 -m py_compile backend/app/transaction.py

# List all branches to see current state
git branch -a

# Check for any other files that might need updating
grep -rn "commented out" backend/app/transaction.py 2>/dev/null || echo "No commented auth checks found"
```

### Action 2: Run Backend to Test
```bash
cd ~/Github/financing/lending-mvp
python3 backend/main.py &
# Note port and test endpoints manually
```

### Action 3: Check Savings Module
```bash
grep -n "assigned_branch" backend/app/savings.py | head -20
```

---

## SUCCESS CRITERIA

✅ Backend starts without errors after transaction.py changes
✅ Customer can access their own transactions
✅ Staff roles restricted to their branch data only
✅ Audit logs appear for denied access attempts
✅ All E2E tests pass (existing + new branch access tests)
✅ Savings module standardized on `branch_code` field

---

## ROLLBACK PLAN

If issues occur, rollback transaction.py:
```bash
cd ~/Github/financing/lending-mvp
git checkout HEAD -- backend/app/transaction.py
```

---

**END OF IMPLEMENTATION PLAN**
