# Branch Security & Role-Based Access Analysis

**Date:** March 3, 2026  
**Status:** ✅ Implementation Review Complete

---

## Executive Summary

The branch-based role and security implementation is **partially implemented**. The RBAC framework exists and is well-designed, but there are **gaps in actual enforcement** across the codebase.

---

## RBAC Framework (✅ Complete)

### Location: `backend/app/auth/rbac.py`

The RBAC module is well-implemented with clear role definitions:

```python
ALL_STAFF_ROLES = {"admin", "branch_manager", "loan_officer", "teller", "auditor"}
BRANCH_SCOPED_ROLES = {"branch_manager", "loan_officer", "teller"}   # see own branch only
CROSS_BRANCH_ROLES = {"admin", "auditor"}                             # see all branches
APPROVAL_ROLES = {"admin", "branch_manager"}                          # approve / disburse
MANAGEMENT_ROLES = {"admin", "branch_manager", "loan_officer"}        # create / edit
```

### Helper Functions Available

| Function | Purpose | Status |
|----------|---------|--------|
| `require_authenticated()` | Check authentication | ✅ Implemented |
| `require_roles()` | Check specific roles | ✅ Implemented |
| `require_approval_role()` | Only admin/branch_manager | ✅ Implemented |
| `require_management_role()` | Create/edit permissions | ✅ Implemented |
| `get_sql_branch_filter()` | Branch scoping for SQL | ✅ Implemented |
| `assert_branch_access()` | Cross-branch access check | ✅ Implemented |
| `assert_own_branch_teller()` | Teller drawer restrictions | ✅ Implemented |

---

## Branch Filtering Implementation

### Customer Module (✅ Good)

**File:** `backend/app/customer.py`

**Branch Filtering:**
```python
# For branch-scoped roles, auto-assign to their branch
if current_user.role in ("loan_officer", "branch_manager"):
    user_branch = getattr(current_user, 'branch_code', None)
    if user_branch:
        input.branch = user_branch

# Store branch_code for scoping
customer_data['branch_code'] = customer_data['branch']
```

**Status:** ✅ **Good** - Branch code is properly stored and enforced for branch-scoped roles.

---

### Loan Module (✅ Good)

**File:** `backend/app/loan.py`

**Branch Filtering:**
```python
# Apply branch filter for non-admin/non-auditor staff
branch_code_filter = get_sql_branch_filter(current_user)
if branch_code_filter:
    query = query.filter(LoanApplication.branch_code == branch_code_filter)
    count_query = count_query.filter(LoanApplication.branch_code == branch_code_filter)
```

**Disbursement Security:**
```python
# Only admin and branch_manager may disburse (approve) loans.
if not current_user or current_user.role not in ("admin", "branch_manager"):
    raise HTTPException(
        status_code=403,
        detail="Not authorized — only admin or branch_manager may disburse loans"
    )
```

**Status:** ✅ **Good** - Proper branch filtering and approval role enforcement.

---

### Savings Module (⚠️ Partial)

**File:** `backend/app/savings.py`

**Branch Filtering:**
```python
# Query with branch filter
branch_filter = None
if current_user.role != "admin" and current_user.role != "customer":
    branch_filter = current_user.assigned_branch
    if not branch_filter:
        return SavingsAccountsResponse(success=True, message="No branch assigned", accounts=[], total=0)

accounts_data = await savings_crud.get_all_savings_accounts(
    search_term=searchTerm, 
    customer_id=customerId,
    branch=branch_filter  # ✅ Branch filtering applied
)
```

**Individual Account Access:**
```python
# Branch check for staff
if current_user.role != "admin" and current_user.role != "customer":
    customer_db = await customer_crud.get_customer_by_id(str(account_data.user_id))
    if customer_db and customer_db.branch != current_user.assigned_branch:
        return SavingsAccountResponse(
            success=False, 
            message=f"Access denied: Account belongs to branch {customer_db.branch}"
        )
```

**Status:** ⚠️ **Partial** - Branch filtering is implemented but uses `assigned_branch` attribute instead of `branch_code`. Need to verify consistency.

---

### Transaction Module (❌ Missing)

**File:** `backend/app/transaction.py`

**Current Implementation:**
```python
# Authorization check (commented out!)
# if str(account.user_id) != str(current_user.id):
#     return TransactionResponse(success=False, message="Not authorized for this account")
```

**Issues Found:**
1. ❌ **No branch filtering** for transactions
2. ❌ **Authorization check is commented out** - users can access any account
3. ❌ **No role-based restrictions** on transaction types

**Status:** ❌ **Critical Gap** - Transaction security is not enforced.

---

## User Module (✅ Good)

**File:** `backend/app/user.py`

**Branch Assignment:**
```python
if input.branch_id is not None or input.branch_code is not None:
    if input.branch_code is not None:
        branch_row = await session.execute(
            select(Branch).where(Branch.code == input.branch_code)
        )
        ba_row = UserBranchAssignment(
            user_id=user.id,
            branch_id=branch_row.scalar_one().id,
            branch_code=input.branch_code,
        )
        session.add(ba_row)
```

**Status:** ✅ **Good** - Branch assignments are properly stored.

---

## Security Gaps Identified

### 1. Transaction Security (Critical)
**Location:** `backend/app/transaction.py`

**Issues:**
- Authorization checks are commented out
- No branch filtering on transactions
- No role-based transaction limits
- No audit trail for unauthorized access attempts

**Recommendation:**
```python
# UNCOMMENT AND ENHANCE:
if str(account.user_id) != str(current_user.id):
    # Check if user has permission to view this account
    if current_user.role in BRANCH_SCOPED_ROLES:
        # Verify account belongs to user's branch
        branch_filter = get_sql_branch_filter(current_user)
        if branch_filter:
            return TransactionResponse(success=False, message="Access denied")
```

### 2. Role Consistency (Medium)
**Location:** Multiple files

**Issue:** Some code uses `assigned_branch` while others use `branch_code`

**Recommendation:** Standardize on `branch_code` across all modules.

### 3. Teller Restrictions (Medium)
**Location:** `backend/app/auth/rbac.py`

**Function:** `assert_own_branch_teller()` exists but may not be called everywhere

**Recommendation:** Ensure teller operations always call `assert_own_branch_teller()`.

---

## Recommendations

### High Priority
1. **Enable transaction authorization** - Uncomment and enhance checks in `transaction.py`
2. **Add branch filtering to transactions** - Filter by user's branch
3. **Add role-based transaction limits** - Tellers should have lower limits than managers

### Medium Priority
4. **Standardize branch field names** - Use `branch_code` consistently
5. **Add audit logging** - Log all branch access attempts
6. **Implement transaction type permissions** - Some transactions should require higher roles

### Low Priority
7. **Add rate limiting** - Prevent brute force attacks
8. **Implement session timeout** - Auto-logout after inactivity
9. **Add MFA support** - Two-factor authentication for staff

---

## Test Cases to Add

### Branch Access Tests
```typescript
// Test 1: Loan officer should only see their branch loans
test('P5-001: Loan officer sees only HQ loans', async ({ page }) => {
    await login(page, 'loan_officer_1');
    await page.goto('/loans');
    await expect(page.locator('.loan-list')).toContainText('HQ');
    await expect(page).not.toContainText('BR-QC');
});

// Test 2: Teller should only see their branch savings
test('P5-002: Teller sees only CDO savings', async ({ page }) => {
    await login(page, 'teller_1');
    await page.goto('/savings');
    await expect(page.locator('.savings-list')).toContainText('BR-CDO');
    await expect(page).not.toContainText('BR-QC');
});

// Test 3: Cross-branch access should be denied
test('P5-003: Branch manager cannot access other branch data', async ({ page }) => {
    await login(page, 'branch_manager');
    await page.goto('/customers');
    await expect(page).not.toContainText('Customers from other branches');
});
```

### Transaction Security Tests
```typescript
// Test 4: Customer can only see their own transactions
test('P5-004: Customer transactions scoped to own account', async ({ page }) => {
    await login(page, 'customer_demo');
    await page.goto('/customer/transactions');
    await expect(page.locator('.transaction-list')).toContainText('My Account');
});

// Test 5: Unauthorized transaction access denied
test('P5-005: Cannot access other user\'s transactions', async ({ page }) => {
    await login(page, 'loan_officer_1');
    await page.goto('/transactions');
    await expect(page).not.toContainText('Other customer accounts');
});
```

---

## Summary

| Component | Status | Branch Filtering | Role Enforcement |
|-----------|--------|------------------|------------------|
| RBAC Framework | ✅ Complete | ✅ | ✅ |
| User Management | ✅ Good | ✅ | ✅ |
| Customer Module | ✅ Good | ✅ | ✅ |
| Loan Module | ✅ Good | ✅ | ✅ |
| Savings Module | ⚠️ Partial | ✅ | ⚠️ |
| Transaction Module | ❌ Critical | ❌ | ❌ |
| Audit Logging | ⚠️ Partial | ✅ | ✅ |

**Overall Status:** ⚠️ **Partially Implemented** - Core RBAC is good, but transaction security needs immediate attention.

---

**END OF ANALYSIS**
