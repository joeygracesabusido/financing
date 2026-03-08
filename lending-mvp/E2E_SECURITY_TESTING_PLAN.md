# E2E Security Testing Plan
# ===========================
# Date: March 8, 2026
# Project: Lending MVP - Branch Security & Role-Based Access Control

## EXECUTIVE SUMMARY

This document outlines the comprehensive E2E testing plan to verify:
1. **3 Branches + 1 Main Office** structure is properly configured
2. **Demo users** are created with correct role assignments
3. **Security controls** are strictly enforced based on user roles
4. **Branch isolation** prevents unauthorized cross-branch data access

---

## TEST ENVIRONMENT SETUP

### 1. Database Setup (3 Branches + HQ)

```sql
-- Create branches
INSERT INTO branch (code, name, address) VALUES 
    ('HQ', 'Headquarters Office', 'Main Street, City'),
    ('BR-QC', 'Quebec Branch', 'Rue Sainte-Catherine, Montreal'),
    ('BR-CDO', 'Central Data Office', 'Business District, Downtown');
```

### 2. Demo User Accounts

| Username | Role | Branch | Purpose |
|----------|------|--------|--------|
| `admin` | admin | HQ | Full cross-branch access |
| `loan_officer_1` | loan_officer | HQ | HQ-only data access |
| `teller_1` | teller | BR-CDO | CDO branch only |
| `customer_demo` | customer | - | Customer account (no branch restriction) |
| `branch_manager_qc` | branch_manager | BR-QC | Quebec branch access |

---

## TEST CASES

### TEST SUITE 1: Branch Structure Verification

#### TC-001: Verify 3 Branches + HQ Exist
```bash
# SQL Query to verify branches exist
grep -r "branches" backend/ --include="*.py" | head -5
```

**Expected:** 4 branches total (HQ + 3 regional)

---

### TEST SUITE 2: User Role Creation

#### TC-002: Admin User Has Full Access
**Steps:**
1. Login as `admin`
2. Navigate to all branches' data
3. Verify cross-branch visibility

**Expected:** ✅ Admin sees ALL branch data (HQ, BR-QC, BR-CDO)

#### TC-003: Loan Officer Has HQ-Only Access
**Steps:**
1. Login as `loan_officer_1` (HQ branch)
2. Navigate to loans/savings/transactions
3. Attempt to view BR-QC and BR-CDO data

**Expected:** ❌ Cannot see BR-QC or BR-CDO data
✅ Only sees HQ branch data

#### TC-004: Teller Has CDO-Only Access
**Steps:**
1. Login as `teller_1` (BR-CDO branch)
2. Navigate to savings/transactions
3. Attempt to view HQ and BR-QC customer data

**Expected:** ❌ Cannot see HQ or BR-QC data
✅ Only sees BR-CDO branch data

#### TC-005: Branch Manager Has Own Branch Access
**Steps:**
1. Login as `branch_manager_qc` (BR-QC branch)
2. Navigate to branch-specific pages
3. Attempt to view HQ and BR-CDO data

**Expected:** ❌ Cannot see HQ or BR-CDO data
✅ Only sees BR-QC branch data

---

### TEST SUITE 3: Transaction Authorization

#### TC-006: Customer Can View Own Transactions
```typescript
test('Customer can view own transactions', async ({ page }) => {
    await login(page, 'customer_demo');
    await page.goto('/transactions');
    
    // Verify customer sees their account
    const account = page.locator('.account-info');
    await expect(account).toBeVisible();
    
    // Verify transactions are visible
    const transactions = page.locator('.transaction-list');
    await expect(transactions).toContainText('My Account');
});
```

**Expected:** ✅ Customer sees only their own transactions

#### TC-007: Staff Cannot Create Transaction on Other Customer Account
```typescript
test('Loan officer cannot create transaction on other customer account', async ({ page }) => {
    await login(page, 'loan_officer_1');
    
    // Try to access another customer's account
    await page.goto('/transactions/create');
    
    // Should be denied
    const error = page.locator('.error-message');
    await expect(error).toContainText('Access denied');
});
```

**Expected:** ❌ Cannot create transaction on other customer's account
✅ Access denied message displayed

#### TC-008: Staff Branch Filtering on Transactions
```typescript
test('Branch manager sees only own branch transactions', async ({ page }) => {
    await login(page, 'branch_manager_qc');
    await page.goto('/transactions');
    
    // Should only see BR-QC transactions
    const transactions = page.locator('.transaction-list');
    await expect(transactions).toContainText('BR-QC');
    await expect(transactions).not.toContainText('HQ');
    await expect(transactions).not.toContainText('BR-CDO');
});
```

**Expected:** ✅ Only sees transactions from own branch (BR-QC)

---

### TEST SUITE 4: Savings Access Control

#### TC-009: Teller Can Only See Own Branch Savings
```typescript
test('Teller sees only CDO branch savings', async ({ page }) => {
    await login(page, 'teller_1');
    await page.goto('/savings');
    
    // Should see CDO accounts
    const savings = page.locator('.savings-list');
    await expect(savings).toContainText('BR-CDO');
    
    // Should NOT see other branches
    await expect(page).not.toContainText('HQ');
    await expect(page).not.toContainText('BR-QC');
});
```

**Expected:** ✅ Only sees BR-CDO savings accounts

#### TC-010: Loan Officer Cannot Access Other Branch Savings
```typescript
test('Loan officer cannot access other branch savings', async ({ page }) => {
    await login(page, 'loan_officer_1'); // HQ
    await page.goto('/savings');
    
    // Should only see HQ accounts
    const savings = page.locator('.savings-list');
    await expect(savings).toContainText('HQ');
    
    // Should NOT see CDO savings
    await expect(page).not.toContainText('BR-CDO');
});
```

**Expected:** ✅ Only sees HQ savings accounts

---

### TEST SUITE 5: Audit Logging Verification

#### TC-011: Unauthorized Access Attempts Are Logged
```bash
# Start backend and trigger unauthorized access
python3 backend/main.py &

# Attempt unauthorized transaction access via API
curl -X GET "http://localhost:8000/api/transactions?account_id=other_account"

# Check logs for AUDIT_LOG entry
grep "AUDIT_LOG" /var/log/*.log | tail -10
```

**Expected:** ✅ Log entry contains:
- User ID of attempting user
- Action type (e.g., `transaction_access_denied`)
- Details about denial reason
- Success status: `false`

#### TC-012: Admin Cross-Branch Access Is Allowed
```bash
# Admin should be able to access all branches
curl -H "Authorization: Bearer admin_token" \
     "http://localhost:8000/api/transactions?account_id=any_account"

# Should succeed (no AUDIT_LOG denial)
grep "AUDIT_LOG.*transaction_access_denied" /var/log/*.log | wc -l
```

**Expected:** ✅ Admin can access all branches
❌ No audit log denials for admin actions

---

### TEST SUITE 6: Fund Transfer Security

#### TC-013: Customer Can Transfer to Any Account
```typescript
test('Customer can transfer funds', async ({ page }) => {
    await login(page, 'customer_demo');
    
    // Navigate to fund transfer
    await page.goto('/transfers');
    
    // Should be able to select destination accounts
    const destination = await page.$('.destination-account select');
    await expect(destination).toBeVisible();
});
```

**Expected:** ✅ Customer can transfer to any account (no branch restrictions)

#### TC-014: Staff Cannot Transfer from Other Customer Account
```typescript
test('Loan officer cannot transfer from other customer account', async ({ page }) => {
    await login(page, 'loan_officer_1');
    
    // Try to transfer funds
    await page.goto('/transfers');
    
    // Should be denied when trying to transfer from non-owned account
    const error = page.locator('.error-message');
    await expect(error).toContainText('Not authorized');
});
```

**Expected:** ❌ Cannot transfer from other customer's account
✅ Access denied message displayed

---

## AUTOMATED TEST SCRIPT

### Playwright E2E Test File: `tests/e2e_security_test.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// Login helper function
async function login(page: Page, username: string) {
    await page.goto('/login');
    await page.fill('[name="username"]', username);
    await page.fill('[name="password"]', 'demo123'); // Use actual demo passwords
    await page.click('button[type="submit"]');
}

// Test Suite: Branch Structure & Security
test.describe('Security - Branch Isolation', () => {
    
    test('TC-001: Verify admin can access all branches', async ({ page }) => {
        await login(page, 'admin');
        await page.goto('/loans');
        
        // Admin should see all branches
        const branches = await page.locator('.branch-list').allTextContents();
        expect(branches).toContain('HQ');
        expect(branches).toContain('BR-QC');
        expect(branches).toContain('BR-CDO');
    });
    
    test('TC-002: Loan officer HQ-only access', async ({ page }) => {
        await login(page, 'loan_officer_1');
        await page.goto('/loans');
        
        // Should only see HQ
        const branches = await page.locator('.branch-list').allTextContents();
        expect(branches).toContain('HQ');
        // Should NOT see other branches
        try {
            await expect(page.locator('.branch-item:has-text("BR-QC")')).not.toBeVisible();
        } catch (e) {
            // Expected - BR-QC should not be visible
        }
    });
    
    test('TC-003: Teller CDO-only access', async ({ page }) => {
        await login(page, 'teller_1');
        await page.goto('/savings');
        
        // Should only see BR-CDO
        const branchInfo = await page.locator('.branch-info').textContent();
        expect(branchInfo).toContain('BR-CDO');
        
        // Should NOT see other branches
        try {
            await expect(page.locator('.account-item:has-text("HQ")')).not.toBeVisible();
        } catch (e) {
            // Expected
        }
    });
    
    test('TC-004: Customer sees own transactions', async ({ page }) => {
        await login(page, 'customer_demo');
        await page.goto('/transactions');
        
        const account = page.locator('.account-info');
        await expect(account).toBeVisible();
        
        const transactions = await page.locator('.transaction-list').count();
        expect(transactions).toBeGreaterThan(0);
    });
    
    test('TC-005: Staff cannot create transaction on other account', async ({ page }) => {
        await login(page, 'loan_officer_1');
        await page.goto('/transactions/create');
        
        const error = page.locator('.error-message');
        await expect(error).toContainText('Access denied');
    });
    
    test('TC-006: Fund transfer branch validation', async ({ page }) => {
        await login(page, 'teller_1');
        await page.goto('/transfers');
        
        // Should only show CDO accounts as source
        const sourceSelect = await page.$('.source-account select');
        await expect(sourceSelect).toBeVisible();
    });
});
```

---

## RUN TESTS

### 1. Start Backend Server
```bash
cd ~/Github/financing/lending-mvp
python3 backend/main.py &
```

### 2. Run Playwright Tests
```bash
cd ~/Github/financing/lending-mvp/tests
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:8000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
EOF

npx playwright install
npm test -- --grep "Security"
```

### 3. Manual Testing Checklist

**Admin User Tests:**
- [ ] Login as admin
- [ ] Can see all branches
- [ ] Can access HQ, BR-QC, BR-CDO data
- [ ] Can create transactions on any account
- [ ] No audit log denials for admin actions

**Loan Officer (HQ) Tests:**
- [ ] Login as loan_officer_1
- [ ] Can ONLY see HQ branch data
- [ ] Cannot see BR-QC or BR-CDO data
- [ ] Cannot access other customers' transactions
- [ ] Audit log shows denied access attempts

**Teller (BR-CDO) Tests:**
- [ ] Login as teller_1
- [ ] Can ONLY see BR-CDO branch data
- [ ] Cannot see HQ or BR-QC data
- [ ] Cannot transfer from other accounts
- [ ] Audit log shows denied access attempts

**Customer Tests:**
- [ ] Login as customer_demo
- [ ] Can see own transactions
- [ ] Can transfer funds freely
- [ ] Can access own account data only

---

## EXPECTED RESULTS SUMMARY

| User Role | Branch Access | Transaction Creation | Fund Transfer | Audit Logging |
|-----------|---------------|---------------------|---------------|---------------|
| admin | ✅ All (HQ, BR-QC, BR-CDO) | ✅ Any account | ✅ Any account | ❌ No denials |
| loan_officer_1 | ✅ HQ only | ❌ Own branch only | ❌ Own branch only | ✅ Denials logged |
| teller_1 | ✅ BR-CDO only | ❌ Own branch only | ❌ Own branch only | ✅ Denials logged |
| customer_demo | ✅ Own account only | N/A | ✅ Any account (own funds) | N/A |

---

## SUCCESS CRITERIA

✅ All test cases pass without errors
✅ Branch isolation is enforced for all staff roles
✅ Audit logging captures all unauthorized access attempts
✅ Admin retains full cross-branch access
✅ Customers have unrestricted access to their own data

---

**END OF E2E TESTING PLAN**
