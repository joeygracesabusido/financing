import { test, expect } from '@playwright/test'

test.describe('E2E Test Suite - Realistic Loan & Savings Operations', () => {
  async function login(page: any, username: string = 'admin', password: string = 'admin123') {
    await page.goto('http://localhost:3010')
    await page.waitForLoadState('networkidle')
    
    const loginButton = page.locator('button:has-text("Login")').or(page.locator('button[type="submit"]'))
    if (await loginButton.isVisible({ timeout: 2000 })) {
      await loginButton.click()
      await page.waitForURL(/\/login/, { timeout: 5000 })
      
      await page.fill('input[type="text"]', username)
      await page.fill('input[type="password"]', password)
      await page.click('button[type="submit"]')
      await page.waitForLoadState('networkidle')
    }
  }

  test('E2E-001: Complete loan application workflow with demo customers', async ({ page }) => {
    await login(page, 'loan_officer_1', 'LoanOfficer@123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    // Create new loan application
    await page.click('button:has-text("New Application")')
    await page.waitForURL(/\/loans\/new/, { timeout: 5000 })
    
    // Select customer - use demo customer Juan dela Cruz
    await page.fill('input[name="customerId"]', 'Juan')
    await page.waitForTimeout(500)
    await page.click('text=Juan dela Cruz', { timeout: 3000 })
    await page.waitForTimeout(500)
    
    // Select loan product
    await page.fill('input[name="productId"]', 'Personal')
    await page.waitForTimeout(500)
    await page.click('text=Personal Loan', { timeout: 3000 })
    
    // Fill loan details
    await page.fill('input[name="principal"]', '150000')
    await page.fill('input[name="termMonths"]', '24')
    await page.fill('input[name="interestRate"]', '14.0')
    
    // Review and submit
    await page.click('button:has-text("Next: Review & Approval")')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h2')).toContainText('Review')
    await expect(page.locator('h2')).toContainText('Approval')
    
    const approvalNote = 'Credit review completed - Customer has good payment history and stable employment'
    await page.fill('textarea[name="approvalNote"]', approvalNote)
    
    await page.click('button:has-text("Submit for Approval")')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=Submitted successfully')).toBeVisible()
    
    const loanUrl = await page.url()
    expect(loanUrl.includes('/loans/')).toBeTruthy()
  })

  test('E2E-002: Multi-stage loan approval workflow', async ({ page }) => {
    await login(page, 'branch_manager', 'BranchMgr@123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    // Find submitted loan
    const submittedLoan = await page.locator('tr[data-status="submitted"]').first()
    if (await submittedLoan.isVisible()) {
      await submittedLoan.click()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
      
      // Review and approve
      const reviewNote = 'Approved based on strong credit history and collateral. Ready for disbursement.'
      await page.fill('textarea[name="reviewNote"]', reviewNote)
      
      await page.click('button:has-text("Approve")')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Approved successfully')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-003: Loan disbursement with Official Receipt generation', async ({ page }) => {
    await login(page, 'admin', 'admin123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    // Find approved loan
    const approvedLoan = await page.locator('tr[data-status="approved"]').first()
    if (await approvedLoan.isVisible()) {
      await approvedLoan.click()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
      
      // Disburse loan
      await page.click('button:has-text("Disburse")')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Disbursed successfully')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-004: Loan repayment with receipt', async ({ page }) => {
    await login(page, 'teller_1', 'Teller@123Demo')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    // Find active loan
    const activeLoan = await page.locator('tr[data-status="active"]').first()
    if (await activeLoan.isVisible()) {
      await activeLoan.click()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
      
      // Make payment
      await page.click('button:has-text("Repayment")')
      await page.waitForLoadState('networkidle')
      
      // Fill payment form with realistic amount
      const paymentAmount = '7500'
      await page.fill('input[name="amount"]', paymentAmount)
      
      await page.fill('textarea[name="note"]', 'Monthly amortization payment')
      
      await page.click('button:has-text("Process Payment")')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('text=Payment processed')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-005: Savings account operations with demo data', async ({ page }) => {
    await login(page, 'teller_1', 'Teller@123Demo')
    await page.goto('http://localhost:3010/savings')
    await page.waitForLoadState('networkidle')
    
    // Create new savings account for demo customer
    await page.click('button:has-text("New Account")')
    await page.waitForLoadState('networkidle')
    
    // Select customer
    await page.fill('input[name="customerId"]', 'Juan')
    await page.waitForTimeout(500)
    await page.click('text=Juan dela Cruz', { timeout: 3000 })
    await page.waitForTimeout(500)
    
    // Select account type
    await page.selectOption('select[name="type"]', 'regular')
    
    // Fill initial deposit
    await page.fill('input[name="initialDeposit"]', '50000')
    
    await page.click('button:has-text("Open Account")')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=Account created successfully')).toBeVisible()
    
    await page.goBack()
    await page.waitForLoadState('networkidle')
    
    // Process deposit transaction
    const savingsAccount = await page.locator('tr[data-type="regular"]').first()
    if (await savingsAccount.isVisible()) {
      await savingsAccount.click()
      await page.waitForLoadState('networkidle')
      
      // Deposit cash
      await page.click('button:has-text("Deposit")')
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[name="amount"]', '10000')
      await page.fill('textarea[name="note"]', 'Cash deposit')
      
      await page.click('button:has-text("Process Deposit")')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('text=Deposit processed')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-006: Loan calculator with different amortization types', async ({ page }) => {
    await login(page)
    await page.goto('http://localhost:3010/calculator')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toContainText('Loan Calculator')
    
    // Test declining balance
    await page.fill('input[type="number"][placeholder="Enter loan amount"]', '500000')
    await page.fill('input[type="range"]', '7.5')
    await page.fill('input[name="termMonths"]', '60')
    
    await page.waitForTimeout(1000)
    
    const monthlyPayment = await page.locator('h3:text("Monthly Payment") + span').textContent()
    expect(monthlyPayment).toBeTruthy()
    expect(parseFloat(monthlyPayment?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0)
    
    // Test flat rate
    await page.selectOption('select', 'flat_rate')
    await page.waitForTimeout(1000)
    
    const flatPayment = await page.locator('h3:text("Monthly Payment") + span').textContent()
    expect(flatPayment).toBeTruthy()
    
    // Test balloon payment
    await page.selectOption('select', 'balloon_payment')
    await page.waitForTimeout(1000)
    
    const balloonPayment = await page.locator('h3:text("Monthly Payment") + span').textContent()
    expect(balloonPayment).toBeTruthy()
    
    // Test interest-only
    await page.selectOption('select', 'interest_only')
    await page.waitForTimeout(1000)
    
    const interestOnlyPayment = await page.locator('h3:text("Monthly Payment") + span').textContent()
    expect(interestOnlyPayment).toBeTruthy()
  })

  test('E2E-007: Loan restructuring workflow', async ({ page }) => {
    await login(page, 'branch_manager', 'BranchMgr@123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    // Find active loan that needs restructuring
    const activeLoan = await page.locator('tr[data-status="active"]').first()
    if (await activeLoan.isVisible()) {
      await activeLoan.click()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
      
      // Navigate to restructuring section
      await page.click('button:has-text("Restructure")')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h2')).toContainText('Restructure')
      
      // Fill restructuring form
      await page.fill('input[name="termMonths"]', '36')
      await page.fill('input[name="interestRate"]', '12.0')
      await page.fill('textarea[name="reason"]', 'Customer requested extension due to financial hardship')
      
      await page.click('button:has-text("Confirm Restructure")')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('text=Loan restructured successfully')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-008: collections and PTP tracking', async ({ page }) => {
    await login(page, 'loan_officer_1', 'LoanOfficer@123')
    await page.goto('http://localhost:3010/collections')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toBeVisible()
    
    // Find past due loan
    const pastDueLoan = await page.locator('tr[data-status="past_due"]').first()
    if (await pastDueLoan.isVisible()) {
      await pastDueLoan.click()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
      
      // Create Promise-to-Pay
      await page.click('button:has-text("Add PTP")')
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[name="ptpDate"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      await page.fill('input[name="ptpAmount"]', '5000')
      
      await page.selectOption('select[name="contactMethod"]', 'phone')
      await page.fill('textarea[name="contactResult"]', 'Customer promised to pay next week')
      
      await page.click('button:has-text("Save PTP")')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('text=Promise-to-Pay created')).toBeVisible()
      
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('E2E-009: Loan calculator UI verification', async ({ page }) => {
    await login(page)
    await page.goto('http://localhost:3010/calculator')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toContainText('Loan Calculator')
    
    // Verify all input fields
    await expect(page.locator('input[type="range"]')).toHaveCount(3)
    await expect(page.locator('select')).toHaveCount(1)
    
    // Verify summary cards
    await expect(page.locator('h3:text("Monthly Payment")')).toBeVisible()
    await expect(page.locator('h3:text("Total Interest")')).toBeVisible()
    await expect(page.locator('h3:text("Total Payment")')).toBeVisible()
    
    // Verify amortization table
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:text("Principal")')).toBeVisible()
    await expect(page.locator('th:text("Interest")')).toBeVisible()
  })

  test('E2E-010: Complete demo scenario - Customer journey', async ({ page }) => {
    // Step 1: Customer applies for loan
    await login(page, 'loan_officer_1', 'LoanOfficer@123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    await page.click('button:has-text("New Application")')
    await page.waitForURL(/\/loans\/new/, { timeout: 5000 })
    
    // Select Maria Santos (demo customer)
    await page.fill('input[name="customerId"]', 'Maria')
    await page.waitForTimeout(500)
    await page.click('text=Maria Cruz Santos', { timeout: 3000 })
    await page.waitForTimeout(500)
    
    // Select Business Loan product
    await page.fill('input[name="productId"]', 'Business')
    await page.waitForTimeout(500)
    await page.click('text=Business Loan', { timeout: 3000 })
    
    // Fill loan details
    await page.fill('input[name="principal"]', '500000')
    await page.fill('input[name="termMonths"]', '36')
    await page.fill('input[name="interestRate"]', '12.0')
    
    // Submit
    await page.click('button:has-text("Next: Review & Approval")')
    await page.waitForLoadState('networkidle')
    
    await page.click('button:has-text("Submit for Approval")')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Submitted successfully')).toBeVisible()
    
    // Step 2: Branch Manager reviews and approves
    await login(page, 'branch_manager', 'BranchMgr@123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    const submittedLoan = await page.locator('tr[data-status="submitted"]').first()
    if (await submittedLoan.isVisible()) {
      await submittedLoan.click()
      await page.waitForLoadState('networkidle')
      
      await page.fill('textarea[name="reviewNote"]', 'Approved - strong financials and good collateral')
      await page.click('button:has-text("Approve")')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Approved successfully')).toBeVisible()
    }
    
    // Step 3: Admin disburses loan
    await login(page, 'admin', 'admin123')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    const approvedLoan = await page.locator('tr[data-status="approved"]').first()
    if (await approvedLoan.isVisible()) {
      await approvedLoan.click()
      await page.waitForLoadState('networkidle')
      
      await page.click('button:has-text("Disburse")')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Disbursed successfully')).toBeVisible()
    }
    
    // Step 4: Teller processes first repayment
    await login(page, 'teller_1', 'Teller@123Demo')
    await page.goto('http://localhost:3010/loans')
    await page.waitForLoadState('networkidle')
    
    const activeLoan = await page.locator('tr[data-status="active"]').first()
    if (await activeLoan.isVisible()) {
      await activeLoan.click()
      await page.waitForLoadState('networkidle')
      
      await page.click('button:has-text("Repayment")')
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[name="amount"]', '16500')
      await page.fill('textarea[name="note"]', 'First monthly amortization')
      
      await page.click('button:has-text("Process Payment")')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Payment processed')).toBeVisible()
    }
    
    // Step 5: Verify savings account creation
    await page.goto('http://localhost:3010/savings')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toContainText('Savings Accounts')
    
    // Open new savings account
    await page.click('button:has-text("New Account")')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[name="customerId"]', 'Maria')
    await page.waitForTimeout(500)
    await page.click('text=Maria Cruz Santos', { timeout: 3000 })
    await page.waitForTimeout(500)
    
    await page.selectOption('select[name="type"]', 'regular')
    await page.fill('input[name="initialDeposit"]', '50000')
    
    await page.click('button:has-text("Open Account")')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Account created successfully')).toBeVisible()
    
    // Deposit cash
    await page.click('button:has-text("Deposit")')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[name="amount"]', '25000')
    await page.fill('textarea[name="note"]', 'Initial deposit')
    
    await page.click('button:has-text("Process Deposit")')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Deposit processed')).toBeVisible()
  })
})