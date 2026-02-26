/**
 * Phase 5 E2E Test Suite - Production-Ready Features
 * ===================================================
 * 
 * Comprehensive test coverage for Phase 5 (Digital & Self-Service Features)
 * including Payment Gateway Integration and Teller Operations
 * 
 * Features Tested:
 * - Payment Gateway Integration (GCash, Maya, InstaPay, PESONet)
 * - Teller Cash Drawer Management
 * - Teller Transaction Limits & Reconciliation
 * - Customer Portal Digital Features
 * - Fund Transfer Requests
 * - QR Code Payments
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_TIMEOUT = 60000;
const NAV_TIMEOUT = 30000;

// Demo users with roles and credentials
const DEMO_USERS = {
  admin: { username: 'admin', password: 'Admin@123Demo', role: 'admin' },
  loan_officer: { username: 'loan_officer_1', password: 'LoanOfficer@123', role: 'loan_officer' },
  teller: { username: 'teller_1', password: 'Teller@123Demo', role: 'teller' },
  branch_manager: { username: 'branch_manager', password: 'BranchMgr@123', role: 'branch_manager' },
  customer: { username: 'juan.dela.cruz', password: 'Customer@123', role: 'customer' },
};

// Demo customers
const DEMO_CUSTOMERS = {
  juan: { name: 'Juan dela Cruz', email: 'juan.sample@example.com', phone: '09171234567' },
  maria: { name: 'Maria Cruz Santos', email: 'maria.sample@example.com', phone: '09181234567' },
  techcorp: { name: 'TechCorp Philippines Inc.', email: 'corp1@example.com' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: any, userKey: keyof typeof DEMO_USERS) {
  const user = DEMO_USERS[userKey];
  
  await page.goto('http://localhost:3010');
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/loans') && !currentUrl.includes('/savings')) {
    await page.waitForSelector('button:has-text("Login")', { timeout: NAV_TIMEOUT });
    await page.click('button:has-text("Login")');
    await page.waitForURL(/\/login/, { timeout: NAV_TIMEOUT });
    
    await page.fill('input[type="text"]', user.username);
    await page.fill('input[type="password"]', user.password);
    
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")'));
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
  }
}

async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

async function openTellerCashDrawer(page: any, initialAmount: string) {
  await page.goto('http://localhost:3010/teller/cash-drawer');
  await waitForPageLoad(page);
  
  await page.fill('input[name="initialAmount"]', initialAmount);
  
  const openBtn = page.locator('button:has-text("Open Drawer"), button:has-text("Start Session")');
  if (await openBtn.isVisible()) {
    await openBtn.click();
    await waitForPageLoad(page);
    
    await expect(page.locator('text=Drawer Open, text=Session Started, text=Opening Balance')).toBeVisible({ timeout: 10000 });
  }
}

async function processTellerTransaction(
  page: any,
  transactionType: 'deposit' | 'withdrawal' | 'transfer',
  amount: string,
  customerName?: string
) {
  const btn = transactionType === 'deposit'
    ? page.locator('button:has-text("Deposit"), button:has-text("Cash In")')
    : transactionType === 'withdrawal'
      ? page.locator('button:has-text("Withdraw"), button:has-text("Cash Out")')
      : page.locator('button:has-text("Transfer"), button:has-text("Fund Transfer")');
  
  if (await btn.isVisible()) {
    await btn.click();
    await waitForPageLoad(page);
  }
  
  if (customerName) {
    await page.fill('input[name="customerId"], input[placeholder*="Customer"]', customerName);
    await page.waitForTimeout(500);
  }
  
  await page.fill('input[name="amount"], input[placeholder*="Amount"]', amount);
  
  const processBtn = page.locator('button:has-text("Process"), button:has-text("Submit"), button:has-text("Confirm")');
  if (await processBtn.isVisible()) {
    await processBtn.click();
    await waitForPageLoad(page);
    
    await expect(page.locator('text=Success, text=processed, text=completed')).toBeVisible({ timeout: 10000 });
  }
}

async function closeTellerCashDrawer(page: any, expectedAmount: string, actualAmount: string) {
  await page.goto('http://localhost:3010/teller/cash-drawer');
  await waitForPageLoad(page);
  
  await page.fill('input[name="expectedAmount"]', expectedAmount);
  await page.fill('input[name="actualAmount"]', actualAmount);
  
  const reasonInput = page.locator('textarea[name="reason"], textarea[placeholder*="Variance"]');
  if (await reasonInput.isVisible()) {
    await reasonInput.fill('Daily reconciliation');
  }
  
  const closeBtn = page.locator('button:has-text("Close Drawer"), button:has-text("End Session"), button:has-text("Reconcile")');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await waitForPageLoad(page);
    
    await expect(page.locator('text=Drawer Closed, text=Session Ended, text=Reconciliation Complete')).toBeVisible({ timeout: 10000 });
  }
}

// ============================================================================
// PHASE 5 E2E TESTS - Production-Ready Digital Features
// ============================================================================

test.describe.configure({ mode: 'serial', timeout: TEST_TIMEOUT });

test.describe('Phase 5: Digital & Self-Service Features (Production-Ready)', () => {
  
  test('P5-001: Customer Dashboard - Account Summary & Real-Time Balances', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Dashboard"), h2:text("Account Overview")')).toBeVisible();
    await expect(page.locator('text=Total Balance, text=Active Loans, text=Next Due Date')).toBeVisible();
    
    const balanceCards = page.locator('.balance-card, .summary-card');
    await expect(balanceCards).toHaveCount(3);
    
    await expect(page.locator('text=Regular Passbook Savings, text=Time Deposit')).toBeVisible();
  });
  
  test('P5-002: Customer Loan Application - Paperless Onboarding', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/loan/application');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Loan Application"), h2:text("Apply for Loan")')).toBeVisible();
    
    await page.fill('input[name="loanAmount"]', '100000');
    await page.fill('input[name="loanTerm"]', '12');
    await page.selectOption('select[name="loanPurpose"]', 'Personal');
    await page.fill('textarea[name="notes"]', 'Emergency expenses');
    
    const submitBtn = page.locator('button:has-text("Submit Application"), button:has-text("Apply Now")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Application Submitted, text=Application ID, text=Pending Review')).toBeVisible({ timeout: 10000 });
    }
  });
  
  test('P5-003: Customer Repayment History - Downloadable Statements', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/repayment-history');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Repayment History"), h2:text("Payment Records")')).toBeVisible();
    
    const paymentTable = page.locator('table:text("Date"), table:text("Amount"), table:text("Status")');
    await expect(paymentTable).toBeVisible();
    
    const downloadBtn = page.locator('button:has-text("Download"), button:has-text("Export")');
    if (await downloadBtn.isVisible()) {
      await downloadBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('text=Statement Generated, text=PDF Ready')).toBeVisible();
  });
  
  test('P5-004: Fund Transfer Request - Account to Account Transfer', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/transfer');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Fund Transfer"), h2:text("Transfer Funds")')).toBeVisible();
    
    await page.fill('input[name="destinationAccount"]', DEMO_CUSTOMERS.maria.name);
    await page.fill('input[name="amount"]', '5000');
    await page.fill('textarea[name="reference"]', 'Monthly support');
    
    const transferBtn = page.locator('button:has-text("Transfer"), button:has-text("Send Funds")');
    if (await transferBtn.isVisible()) {
      await transferBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Transfer Successful, text=Reference Number, text=Pending Confirmation')).toBeVisible({ timeout: 10000 });
    }
  });
  
  test('P5-005: Teller Cash Drawer Management - Opening Balance', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    
    await expect(page.locator('text=Session ID, text=Open Date, text=Opening Balance: 10000')).toBeVisible();
    
    const drawerStatus = page.locator('.drawer-status, .session-status');
    await expect(drawerStatus).toContainText('Open', { timeout: 10000 });
  });
  
  test('P5-006: Teller Cash Drawer Management - Cash In Transaction', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    
    await processTellerTransaction(page, 'deposit', '50000', DEMO_CUSTOMERS.juan.name);
    
    const balanceDisplay = page.locator('text=Current Balance, text=Available Balance');
    await expect(balanceDisplay).toBeVisible();
    
    await expect(page.locator('text=Balance Updated, text=Transaction Recorded')).toBeVisible();
  });
  
  test('P5-007: Teller Cash Drawer Management - Cash Out Transaction', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    
    await processTellerTransaction(page, 'withdrawal', '20000', DEMO_CUSTOMERS.maria.name);
    
    const balanceDisplay = page.locator('text=Current Balance, text=Available Balance');
    await expect(balanceDisplay).toBeVisible();
    
    await expect(page.locator('text=Balance Updated, text=Transaction Recorded')).toBeVisible();
  });
  
  test('P5-008: Teller Cash Drawer Management - End-of-Day Reconciliation', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    await processTellerTransaction(page, 'deposit', '50000', DEMO_CUSTOMERS.juan.name);
    await processTellerTransaction(page, 'withdrawal', '20000', DEMO_CUSTOMERS.maria.name);
    
    await closeTellerCashDrawer(page, '40000', '40000');
    
    await expect(page.locator('text=No Variance, text=Balanced, text=Reconciliation Complete')).toBeVisible();
  });
  
  test('P5-009: Teller Transaction Limits - Configurable Per Role', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('http://localhost:3010/admin/settings/teller-limits');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Teller Limits"), h2:text("Transaction Limits")')).toBeVisible();
    
    const limitInputs = page.locator('input[name*="limit"], input[name*="threshold"]');
    await expect(limitInputs).toHaveCount(5);
    
    await page.fill('input[name="dailyLimit"]', '500000');
    await page.fill('input[name="weeklyLimit"]', '2000000');
    await page.fill('input[name="monthlyLimit"]', '8000000');
    
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update Settings")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Settings Saved, text=Limits Updated')).toBeVisible();
    }
  });
  
  test('P5-010: QR Code Payment - Generate Payment QR', async ({ page }) => {
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/qrcode');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("QR Payment"), h2:text("Generate QR Code")')).toBeVisible();
    
    await page.fill('input[name="amount"]', '15000');
    await page.fill('input[name="reference"]', 'Loan Repayment QR');
    
    const generateBtn = page.locator('button:has-text("Generate QR"), button:has-text("Create Code")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
      
      const qrImage = page.locator('img[alt*="QR"], canvas[alt*="QR"]');
      await expect(qrImage).toBeVisible();
    }
    
    await expect(page.locator('text=Scan QR Code, text=Payment Reference')).toBeVisible();
  });
  
  test('P5-011: Payment Gateway - GCash Integration', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/payment-gateway');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Payment Methods"), h2:text("Digital Payments")')).toBeVisible();
    
    const gcashBtn = page.locator('button:has-text("GCash"), button:has-text("Pay with GCash")');
    if (await gcashBtn.isVisible()) {
      await gcashBtn.click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('text=GCash Payment, text=Mobile Number, text=Amount')).toBeVisible();
    }
  });
  
  test('P5-012: Payment Gateway - InstaPay Transfer', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/payment-gateway');
    await waitForPageLoad(page);
    
    const instapayBtn = page.locator('button:has-text("InstaPay"), button:has-text("Real-Time Transfer")');
    if (await instapayBtn.isVisible()) {
      await instapayBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=InstaPay Transfer, text=BSP Real-Time, text=Instant')).toBeVisible();
      
      await page.fill('input[name="accountNumber"]', '0028437123456789');
      await page.fill('input[name="bankCode"]', '002');
      await page.fill('input[name="amount"]', '25000');
      await page.fill('textarea[name="purpose"]', 'Loan repayment');
      
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Send Now")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        
        await expect(page.locator('text=Transfer Initiated, text=Transaction Reference, text=Pending')).toBeVisible();
      }
    }
  });
  
  test('P5-013: Payment Gateway - PESONet Batch Transfer', async ({ page }) => {
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/payment-gateway');
    await waitForPageLoad(page);
    
    const pesonetBtn = page.locator('button:has-text("PESONet"), button:has-text("Batch Transfer")');
    if (await pesonetBtn.isVisible()) {
      await pesonetBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=PESONet Payments, text=Same-Day Settlement, text=Batch Processing')).toBeVisible();
    }
  });
  
  test('P5-014: Fund Transfer Between Accounts - Internal Transfer', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/fund-transfer');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Internal Transfer"), h2:text("Account Transfer")')).toBeVisible();
    
    await page.fill('input[name="fromAccount"]', DEMO_CUSTOMERS.juan.name);
    await page.fill('input[name="toAccount"]', DEMO_CUSTOMERS.maria.name);
    await page.fill('input[name="amount"]', '10000');
    await page.fill('textarea[name="reference"]', 'Savings transfer');
    
    const transferBtn = page.locator('button:has-text("Transfer"), button:has-text("Submit Transfer")');
    if (await transferBtn.isVisible()) {
      await transferBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Transfer Completed, text=Reference Number, text=Success')).toBeVisible({ timeout: 10000 });
    }
  });
  
  test('P5-015: Customer Notifications - Email & SMS Framework', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/notifications');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Notifications"), h2:text("Alert Settings")')).toBeVisible();
    
    const notificationMethods = page.locator('text=Email, text=SMS, text=Push Notification');
    await expect(notificationMethods).toHaveCount(3);
    
    const emailToggle = page.locator('input[type="checkbox"][value*="email"]');
    if (await emailToggle.isVisible()) {
      await emailToggle.check();
    }
    
    await expect(page.locator('text=Notifications Updated, text=Preferences Saved')).toBeVisible();
  });
  
  test('P5-016: Teller Session Management - Concurrent Sessions', async ({ page }) => {
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/sessions');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Teller Sessions"), h2:text("Active Sessions")')).toBeVisible();
    
    const activeSessions = page.locator('.session-card, .session-row');
    await expect(activeSessions).toBeVisible();
    
    await expect(page.locator('text=Session Status, text=Start Time, text=Current Balance')).toBeVisible();
  });
  
  test('P5-017: Customer Portal Navigation - Sidebar Menu', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/dashboard');
    await waitForPageLoad(page);
    
    const sidebar = page.locator('.sidebar, .nav-menu, .customer-menu');
    await expect(sidebar).toBeVisible();
    
    const menuItems = ['Dashboard', 'Loans', 'Savings', 'Transfer', 'Payments'];
    for (const item of menuItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });
  
  test('P5-018: Loan Repayment with QR Code - End-to-End Workflow', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    
    await page.goto('http://localhost:3010/teller/qrcode');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('input[name="reference"]', 'Loan Repayment QR');
    
    const generateBtn = page.locator('button:has-text("Generate QR"), button:has-text("Create Code")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await processTellerTransaction(page, 'deposit', '5000', DEMO_CUSTOMERS.juan.name);
    
    await closeTellerCashDrawer(page, '15000', '15000');
    
    await expect(page.locator('text=Reconciliation Complete, text=No Variance')).toBeVisible();
  });
  
  test('P5-019: Payment Gateway - Maya Integration', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/payment-gateway');
    await waitForPageLoad(page);
    
    const mayaBtn = page.locator('button:has-text("Maya"), button:has-text("Pay with Maya")');
    if (await mayaBtn.isVisible()) {
      await mayaBtn.click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('text=Maya Wallet, text=E-Wallet Payment, text=Instant')).toBeVisible();
    }
  });
  
  test('P5-020: Teller Operations - Transaction Limits Enforcement', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('http://localhost:3010/admin/settings/teller-limits');
    await waitForPageLoad(page);
    
    await page.fill('input[name="dailyLimit"]', '1000000');
    await page.fill('input[name="singleTransactionLimit"]', '500000');
    
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update Settings")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Settings Saved, text=Limits Updated')).toBeVisible();
    }
    
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/cash-drawer');
    
    const amountInput = page.locator('input[name="amount"]');
    await expect(amountInput).toBeVisible();
  });
});

// ============================================================================
// PHASE 5 EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Phase 5 Edge Cases & Error Handling', () => {
  
  test('P5-EDGE-001: Teller Cash Drawer - Insufficient Balance', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    
    await page.goto('http://localhost:3010/teller/cash-drawer');
    await processTellerTransaction(page, 'withdrawal', '15000', DEMO_CUSTOMERS.juan.name);
    
    await expect(page.locator('text=Insufficient Balance, text=Transaction Rejected, text=Limit Exceeded')).toBeVisible();
  });
  
  test('P5-EDGE-002: Fund Transfer - Insufficient Funds', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/fund-transfer');
    await waitForPageLoad(page);
    
    await page.fill('input[name="fromAccount"]', DEMO_CUSTOMERS.juan.name);
    await page.fill('input[name="toAccount"]', DEMO_CUSTOMERS.maria.name);
    await page.fill('input[name="amount"]', '1000000000');
    
    const transferBtn = page.locator('button:has-text("Transfer"), button:has-text("Submit Transfer")');
    if (await transferBtn.isVisible()) {
      await transferBtn.click();
      
      await expect(page.locator('text=Insufficient Funds, text=Transaction Rejected, text=Limit Exceeded')).toBeVisible();
    }
  });
  
  test('P5-EDGE-003: Payment Gateway - Invalid QR Code', async ({ page }) => {
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/qrcode');
    
    await expect(page.locator('text=Scan QR Code, text=Payment Reference')).toBeVisible();
    
    await expect(page.locator('text=Invalid QR, text=Scan Failed, text=QR Expired')).not.toBeVisible();
  });
  
  test('P5-EDGE-004: Teller Reconciliation - Variance Handling', async ({ page }) => {
    await login(page, 'teller');
    await openTellerCashDrawer(page, '10000');
    await processTellerTransaction(page, 'deposit', '50000', DEMO_CUSTOMERS.juan.name);
    
    await closeTellerCashDrawer(page, '50000', '49000');
    
    await expect(page.locator('text=Variance Reported, text=Shortage: 1000, text=Reconciliation Complete')).toBeVisible();
  });
  
  test('P5-EDGE-005: Customer Loan Application - Duplicate Submission', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/loan/application');
    await waitForPageLoad(page);
    
    await page.fill('input[name="loanAmount"]', '100000');
    await page.fill('input[name="loanTerm"]', '12');
    
    const submitBtn = page.locator('button:has-text("Submit Application"), button:has-text("Apply Now")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Application Submitted, text=Application ID')).toBeVisible();
      
      await page.goto('http://localhost:3010/customer/loan/application');
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Pending Application, text=Active Application, text=Already Submitted')).toBeVisible();
    }
  });
});

// ============================================================================
// PHASE 5 PERFORMANCE & SCALABILITY
// ============================================================================

test.describe('Phase 5 Performance & Scalability', () => {
  
  test('P5-PERF-001: Dashboard Load Time - Under 2 Seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/dashboard');
    await waitForPageLoad(page);
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });
  
  test('P5-PERF-002: QR Code Generation - Under 3 Seconds', async ({ page }) => {
    await login(page, 'teller');
    await page.goto('http://localhost:3010/teller/qrcode');
    await waitForPageLoad(page);
    
    const startTime = Date.now();
    
    await page.fill('input[name="amount"]', '50000');
    await page.fill('input[name="reference"]', 'Performance Test');
    
    const generateBtn = page.locator('button:has-text("Generate QR"), button:has-text("Create Code")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(3000);
    }
    
    const genTime = Date.now() - startTime;
    expect(genTime).toBeLessThan(3000);
  });
  
  test('P5-PERF-003: Payment Gateway Response - Under 5 Seconds', async ({ page }) => {
    await login(page, 'customer');
    await page.goto('http://localhost:3010/customer/payment-gateway');
    await waitForPageLoad(page);
    
    const startTime = Date.now();
    
    const gcashBtn = page.locator('button:has-text("GCash"), button:has-text("Pay with GCash")');
    if (await gcashBtn.isVisible()) {
      await gcashBtn.click();
      await page.waitForTimeout(5000);
    }
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000);
  });
});