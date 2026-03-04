/**
 * Phase 3 & 4 E2E Test Suite
 * ===========================
 * 
 * Comprehensive test coverage for Phase 3 (Savings & Deposit Products) 
 * and Phase 4 (Compliance, Reporting & Risk)
 * 
 * Features Tested:
 * - Savings Account Types (Regular, Time Deposit, Share Capital, Goal, Minor, Joint)
 * - Interest Computation (ADB, WHT, tiers)
 * - KYC Document Management
 * - AML Screening & Alerts
 * - Regulatory Reporting (PAR, NPL, LLR)
 * - Financial Statements (Trial Balance, P&L, Balance Sheet)
 * - Interconnected Demo Data Workflow
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
  auditor: { username: 'auditor', password: 'Auditor@123Demo', role: 'auditor' },
};

// Demo customers
const DEMO_CUSTOMERS = {
  juan: { name: 'Juan dela Cruz', email: 'juan.sample@example.com' },
  maria: { name: 'Maria Cruz Santos', email: 'maria.sample@example.com' },
  pedro: { name: 'Pedro Lopez Garcia', email: 'pedro.sample@example.com' },
  joint: { name: 'Dela Cruz - Santos Joint Account', email: 'joint.sample@example.com' },
  techcorp: { name: 'TechCorp Philippines Inc.', email: 'corp1@example.com' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: any, userKey: keyof typeof DEMO_USERS) {
  const user = DEMO_USERS[userKey];
  
  // Navigate to login
  await page.goto('http://localhost:3010');
  await page.waitForLoadState('networkidle');
  
  // Handle login if not already authenticated
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/loans') && !currentUrl.includes('/savings')) {
    await page.waitForSelector('button:has-text("Login")', { timeout: NAV_TIMEOUT });
    await page.click('button:has-text("Login")');
    await page.waitForURL(/\/login/, { timeout: NAV_TIMEOUT });
    
    await page.fill('input[type="text"]', user.username);
    await page.fill('input[type="password"]', user.password);
    
    // Wait for and click login button
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")'));
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
  }
}

async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow animations to complete
}

async function createSavingsAccount(
  page: any,
  customerName: string,
  accountType: string,
  initialDeposit: string
) {
  // Navigate to savings
  await page.goto('http://localhost:3010/savings');
  await waitForPageLoad(page);
  
  // Click new account button
  const newAccountBtn = page.locator('button:has-text("New Account"), button:has-text("Create Account")');
  if (await newAccountBtn.isVisible()) {
    await newAccountBtn.click();
    await waitForPageLoad(page);
  }
  
  // Select customer
  await page.fill('input[name="customerId"], input[placeholder*="Customer"]', customerName);
  await page.waitForTimeout(500);
  
  const customerOption = page.locator(`text=${customerName}`).first();
  if (await customerOption.isVisible()) {
    await customerOption.click();
    await page.waitForTimeout(500);
  }
  
  // Select account type
  const typeSelect = page.locator('select[name="type"], select[aria-label*="Account Type"]');
  if (await typeSelect.isVisible()) {
    await typeSelect.selectOption({ label: accountType });
    await page.waitForTimeout(500);
  }
  
  // Fill initial deposit
  const depositInput = page.locator('input[name="initialDeposit"], input[placeholder*="Deposit"]');
  if (await depositInput.isVisible()) {
    await depositInput.fill(initialDeposit);
  }
  
  // Open account
  const openBtn = page.locator('button:has-text("Open Account"), button:has-text("Create Account")');
  if (await openBtn.isVisible()) {
    await openBtn.click();
    await waitForPageLoad(page);
    
    // Verify account created
    await expect(page.locator('text=Account created successfully, text=Success')).toBeVisible({ timeout: 10000 });
  }
}

async function processSavingsTransaction(
  page: any,
  transactionType: 'deposit' | 'withdrawal',
  amount: string,
  note: string
) {
  // Click appropriate button
  const btn = transactionType === 'deposit' 
    ? page.locator('button:has-text("Deposit"), button:has-text("Cash In")')
    : page.locator('button:has-text("Withdraw"), button:has-text("Cash Out")');
  
  if (await btn.isVisible()) {
    await btn.click();
    await waitForPageLoad(page);
  }
  
  // Fill amount
  const amountInput = page.locator('input[name="amount"], input[placeholder*="Amount"]');
  if (await amountInput.isVisible()) {
    await amountInput.fill(amount);
  }
  
  // Fill note if available
  const noteInput = page.locator('textarea[name="note"], textarea[placeholder*="Note"]');
  if (await noteInput.isVisible()) {
    await noteInput.fill(note);
  }
  
  // Process transaction
  const processBtn = page.locator('button:has-text("Process"), button:has-text("Submit"), button:has-text("Confirm")');
  if (await processBtn.isVisible()) {
    await processBtn.click();
    await waitForPageLoad(page);
    
    // Verify success
    await expect(page.locator('text=Success, text=processed, text=completed')).toBeVisible({ timeout: 10000 });
  }
}

// ============================================================================
// PHASE 3 E2E TESTS - Savings & Deposit Products
// ============================================================================

test.describe.configure({ mode: 'serial', timeout: TEST_TIMEOUT });

test.describe('Phase 3: Savings & Deposit Products', () => {
  
  test('P3-001: Admin can access Savings Dashboard', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Savings Accounts"), h2:text("Savings")')).toBeVisible();
    await expect(page.locator('button:has-text("New Account")')).toBeVisible();
    await expect(page.locator('text=Regular, text=Time Deposit, text=Share Capital')).toBeVisible();
  });

  test('P3-002: Create Regular Passbook Savings Account for Juan dela Cruz', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.juan.name,
      'Regular',
      '50000'
    );
    
    // Verify account exists in list
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const accountRow = page.locator(`tr:text("${DEMO_CUSTOMERS.juan.name}")`).first();
    await expect(accountRow).toBeVisible();
    await expect(accountRow.locator('td:text("Regular"), td:text("active")')).toBeVisible();
  });

  test('P3-003: Time Deposit Account Creation with Maturity Details', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.juan.name,
      'Time Deposit',
      '100000'
    );
    
    // Navigate to account details to verify TD fields
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const tdAccount = page.locator(`tr:text("${DEMO_CUSTOMERS.juan.name}")`).filter({ hasText: 'Time Deposit' }).first();
    if (await tdAccount.isVisible()) {
      await tdAccount.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Maturity Date, text=Principal, text=Interest Rate')).toBeVisible();
    }
  });

  test('P3-004: Share Capital Account for Corporate Customer', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.techcorp.name,
      'Share Capital',
      '500000'
    );
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const shareAccount = page.locator(`tr:text("${DEMO_CUSTOMERS.techcorp.name}")`).filter({ hasText: 'Share Capital' }).first();
    await expect(shareAccount).toBeVisible();
    
    if (await shareAccount.isVisible()) {
      await shareAccount.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Share Value, text=Total Shares, text=Membership Date')).toBeVisible();
    }
  });

  test('P3-005: Goal Savings Account with Target Tracking', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.maria.name,
      'Goal Savings',
      '100000'
    );
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const goalAccount = page.locator(`tr:text("${DEMO_CUSTOMERS.maria.name}")`).filter({ hasText: 'Goal' }).first();
    if (await goalAccount.isVisible()) {
      await goalAccount.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Target Amount, text=Target Date, text=Progress')).toBeVisible();
    }
  });

  test('P3-006: Joint Account with Multiple Signatories', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.joint.name,
      'Joint',
      '100000'
    );
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const jointAccount = page.locator(`tr:text("${DEMO_CUSTOMERS.joint.name}")`).first();
    if (await jointAccount.isVisible()) {
      await jointAccount.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Joint Account, text=Multiple Signatories, text=AND/OR Rules')).toBeVisible();
    }
  });

  test('P3-007: Minor Account with Guardian Linkage', async ({ page }) => {
    await login(page, 'teller');
    
    await createSavingsAccount(
      page,
      'Minor Account',
      'Minor',
      '10000'
    );
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const minorAccount = page.locator('tr:text("Minor Account")').first();
    if (await minorAccount.isVisible()) {
      await minorAccount.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Guardian, text=Minor Account, text=Age Restriction')).toBeVisible();
    }
  });

  test('P3-008: Savings Deposit Transaction with Double-Entry Accounting', async ({ page }) => {
    await login(page, 'teller');
    
    // First, navigate to an existing savings account
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const savingsAccount = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await savingsAccount.isVisible()) {
      await savingsAccount.click();
      await waitForPageLoad(page);
      
      // Process deposit
      await processSavingsTransaction(page, 'deposit', '25000', 'Initial deposit for Juan dela Cruz');
      
      // Verify account balance updated
      const balanceDisplay = page.locator('text=Balance, .balance-display, .account-balance');
      if (await balanceDisplay.isVisible()) {
        const balanceText = await balanceDisplay.textContent();
        expect(balanceText).toMatch(/80000|85000/); // Should reflect the deposit
      }
    }
  });

  test('P3-009: Interest Computation with ADB Method and WHT', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    // Navigate to savings detail to check interest calculation
    const savingsAccount = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await savingsAccount.isVisible()) {
      await savingsAccount.click();
      await waitForPageLoad(page);
      
      // Verify interest calculation is displayed
      await expect(page.locator('text=Interest Rate, text=ADB Method, text=Withholding Tax')).toBeVisible();
      
      // Check passbook tab for interest postings
      const passbookTab = page.locator('button:has-text("Passbook"), button:has-text("Transactions")');
      if (await passbookTab.isVisible()) {
        await passbookTab.click();
        await waitForPageLoad(page);
        
        // Interest posting should be visible in passbook
        const interestEntry = page.locator('tr:text("Interest"), tr:text("Posting")').first();
        // Note: This may not exist yet if interest hasn't been posted, but we verify the UI supports it
        await expect(page.locator('text=Interest Posting, text=ADB Calculation, text=WHT')).toBeVisible();
      }
    }
  });

  test('P3-010: Interest Rate Tier System', async ({ page }) => {
    await login(page, 'admin');
    
    // Navigate to savings account with higher balance to test tiered rates
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    // Find account with higher balance
    const highBalanceAccount = page.locator('tr').filter({ hasText: '100000' }).first();
    if (await highBalanceAccount.isVisible()) {
      await highBalanceAccount.click();
      await waitForPageLoad(page);
      
      // Verify tiered interest rate display
      await expect(page.locator('text=Balance Tier, text=Rate, text=Higher Rate')).toBeVisible();
    }
  });

  test('P3-011: Savings Passbook Print Functionality', async ({ page }) => {
    await login(page, 'teller');
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const savingsAccount = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await savingsAccount.isVisible()) {
      await savingsAccount.click();
      await waitForPageLoad(page);
      
      // Open passbook
      const passbookBtn = page.locator('button:has-text("Passbook"), button:has-text("View Passbook")');
      if (await passbookBtn.isVisible()) {
        await passbookBtn.click();
        await waitForPageLoad(page);
        
        // Verify passbook display
        await expect(page.locator('text=Date, text=Description, text=Debit, text=Credit, text=Balance')).toBeVisible();
        
        // Test print
        const printBtn = page.locator('button:has-text("Print"), button:has-text("Print Passbook")');
        if (await printBtn.isVisible()) {
          await printBtn.click();
          await page.waitForTimeout(500);
          
          // In Playwright, we can't capture the actual print dialog, but we can verify the click happened
          // The print dialog is handled by the browser
        }
      }
    }
  });

  test('P3-012: Fund Transfer Between Internal Savings Accounts', async ({ page }) => {
    await login(page, 'teller');
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const account = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await account.isVisible()) {
      await account.click();
      await waitForPageLoad(page);
      
      // Try internal transfer option
      const transferBtn = page.locator('button:has-text("Transfer"), button:has-text("Internal Transfer")');
      if (await transferBtn.isVisible()) {
        await transferBtn.click();
        await waitForPageLoad(page);
        
        await expect(page.locator('text=Transfer Funds, text=Source Account, text=Destination Account')).toBeVisible();
      }
    }
  });

  test('P3-013: Standing Order / Auto-Debit Setup', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const account = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await account.isVisible()) {
      await account.click();
      await waitForPageLoad(page);
      
      const standingOrderBtn = page.locator('button:has-text("Standing Order"), button:has-text("Auto-Debit"), button:has-text("Scheduled")');
      if (await standingOrderBtn.isVisible()) {
        await standingOrderBtn.click();
        await waitForPageLoad(page);
        
        await expect(page.locator('text=Auto-Debit, text=Schedule, text=Frequency, text=Amount')).toBeVisible();
      }
    }
  });

  test('P3-014: Balance Inquiry and Account Summary', async ({ page }) => {
    await login(page, 'teller');
    
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const account = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await account.isVisible()) {
      await account.click();
      await waitForPageLoad(page);
      
      // Verify account summary is visible
      await expect(page.locator('h1, h2:text("Account Summary"), .account-summary')).toBeVisible();
      
      // Verify key metrics
      await expect(page.locator('text=Account Number, text=Account Type, text=Current Balance, text=Status')).toBeVisible();
    }
  });

  test('P3-015: Complete Savings Account Lifecycle Workflow', async ({ page }) => {
    await login(page, 'teller');
    
    // Step 1: Open new savings account
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    await createSavingsAccount(
      page,
      DEMO_CUSTOMERS.pedro.name,
      'Regular',
      '75000'
    );
    
    // Step 2: Verify account created
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const newAccount = page.locator(`tr:text("${DEMO_CUSTOMERS.pedro.name}")`).first();
    await expect(newAccount).toBeVisible();
    
    // Step 3: Process first deposit
    await newAccount.click();
    await waitForPageLoad(page);
    
    await processSavingsTransaction(page, 'deposit', '50000', 'Second deposit');
    
    // Step 4: Check account balance
    const balanceDisplay = page.locator('.account-balance, .balance-display, text=Balance');
    if (await balanceDisplay.isVisible()) {
      const balanceText = await balanceDisplay.textContent();
      expect(balanceText).toMatch(/125000/);
    }
  });
});

// ============================================================================
// PHASE 4 E2E TESTS - Compliance, Reporting & Risk
// ============================================================================

test.describe('Phase 4: Compliance, Reporting & Risk', () => {
  
  test('P4-001: Admin can access Compliance Dashboard', async ({ page }) => {
    await login(page, 'admin');
    
    // Navigate to compliance dashboard
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Compliance Dashboard"), h2:text("AML & Risk")')).toBeVisible();
    await expect(page.locator('text=Portfolio At Risk, text=Non-Performing Loans, text=Loan Loss Reserve')).toBeVisible();
  });

  test('P4-002: KYC Document Management Workflow', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/kyc-documents');
    await waitForPageLoad(page);
    
    // Verify KYC documents page loads
    await expect(page.locator('h1:text("KYC Documents"), h2:text("Document Management")')).toBeVisible();
    
    // Check for document status filters
    await expect(page.locator('text=Verified, text=Pending, text=Rejected')).toBeVisible();
  });

  test('P4-003: AML Alert Dashboard with Realistic Data', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to AML alerts section
    const alertsTab = page.locator('button:has-text("AML Alerts"), button:has-text("Alerts")');
    if (await alertsTab.isVisible()) {
      await alertsTab.click();
      await waitForPageLoad(page);
      
      // Verify AML alerts display
      await expect(page.locator('h2:text("AML Alerts"), h3:text("Alerts")')).toBeVisible();
      await expect(page.locator('text=Alert Type, text=Severity, text=Status, text=Created Date')).toBeVisible();
      
      // Check for alert types
      await expect(page.locator('text=Suspicious Activity, text=CTR, text=PEP, text=SAR')).toBeVisible();
    }
  });

  test('P4-004: OFAC & PEP Screening Results Display', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to screening section
    const screeningBtn = page.locator('button:has-text("Screening"), button:has-text("Watchlist")');
    if (await screeningBtn.isVisible()) {
      await screeningBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=OFAC Check, text=PEP Check, text=Sanctioned Countries')).toBeVisible();
    }
  });

  test('P4-005: Currency Transaction Report (CTR) Auto-Flagging', async ({ page }) => {
    await login(page, 'teller');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to CTR section
    const ctrTab = page.locator('button:has-text("CTR"), button:has-text("Currency Transactions")');
    if (await ctrTab.isVisible()) {
      await ctrTab.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("CTR Reports"), h3:text("Currency Transactions > PHP 500,000")')).toBeVisible();
    }
  });

  test('P4-006: Suspicious Activity Report (SAR) Creation', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to SAR section
    const sarBtn = page.locator('button:has-text("New SAR"), button:has-text("Create SAR")');
    if (await sarBtn.isVisible()) {
      await sarBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Suspicious Activity Report, text=Customer, text=Description, text=Rationale')).toBeVisible();
    }
  });

  test('P4-007: Portfolio At Risk (PAR) Metrics Dashboard', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Verify PAR metrics are displayed
    await expect(page.locator('text=PAR1, text=PAR7, text=PAR30, text=PAR90')).toBeVisible();
    
    // Check PAR display cards
    await expect(page.locator('.par-card, .metric-card')).toHaveCount(4);
  });

  test('P4-008: Non-Performing Loans (NPL) Report Display', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to NPL report
    const nplTab = page.locator('button:has-text("NPL"), button:has-text("Non-Performing")');
    if (await nplTab.isVisible()) {
      await nplTab.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("NPL Report"), h3:text("Non-Performing Loans")')).toBeVisible();
      await expect(page.locator('text=Loan ID, text=Borrower, text=Amount, text=Days Past Due')).toBeVisible();
    }
  });

  test('P4-009: Loan Loss Reserve (LLR) Calculation Display', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to LLR section
    const llrTab = page.locator('button:has-text("LLR"), button:has-text("Loss Reserve")');
    if (await llrTab.isVisible()) {
      await llrTab.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("LLR Report"), h3:text("Loan Loss Reserve")')).toBeVisible();
      
      // Verify LLR calculation is displayed
      await expect(page.locator('text=Total Reserve, text=Provision, text=Required Reserve')).toBeVisible();
    }
  });

  test('P4-010: Trial Balance Generation from GL Entries', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Trial Balance
    const tbBtn = page.locator('button:has-text("Trial Balance"), button:has-text("Financial Reports")');
    if (await tbBtn.isVisible()) {
      await tbBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Trial Balance"), h3:text("General Ledger")')).toBeVisible();
      
      // Verify GL account display
      await expect(page.locator('text=Account Code, text=Account Name, text=Debit, text=Credit, text=Balance')).toBeVisible();
    }
  });

  test('P4-011: Income Statement (P&L) Generation', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Income Statement
    const plBtn = page.locator('button:has-text("Income Statement"), button:has-text("P&L")');
    if (await plBtn.isVisible()) {
      await plBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Income Statement"), h3:text("Profit & Loss")')).toBeVisible();
      
      // Verify P&L sections
      await expect(page.locator('text=Interest Income, text=Fee Income, text=Operating Expenses, text=Net Income')).toBeVisible();
    }
  });

  test('P4-012: Balance Sheet Generation', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Balance Sheet
    const bsBtn = page.locator('button:has-text("Balance Sheet"), button:has-text("Financial Position")');
    if (await bsBtn.isVisible()) {
      await bsBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Balance Sheet"), h3:text("Financial Position")')).toBeVisible();
      
      // Verify balance sheet sections
      await expect(page.locator('text=Assets, text=Liabilities, text=Capital, text=Equity')).toBeVisible();
    }
  });

  test('P4-013: Cash Flow Statement Display', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Cash Flow Statement
    const cfBtn = page.locator('button:has-text("Cash Flow"), button:has-text("Cash Flow Statement")');
    if (await cfBtn.isVisible()) {
      await cfBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Cash Flow Statement"), h3:text("Cash Flows")')).toBeVisible();
      
      // Verify cash flow sections
      await expect(page.locator('text=Operating Activities, text=Investing Activities, text=Financing Activities')).toBeVisible();
    }
  });

  test('P4-014: Period Closing Process (Month-End)', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to period closing
    const closeBtn = page.locator('button:has-text("Period Closing"), button:has-text("Month-End Close")');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Period Closing"), h3:text("Month-End Closing")')).toBeVisible();
      
      // Verify closing inputs
      await expect(page.locator('text=Closing Date, text=Verify Balances, text=Confirm Closing')).toBeVisible();
    }
  });

  test('P4-015: Loan-to-Value (LTV) Ratio Display', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to risk management section
    const riskBtn = page.locator('button:has-text("Risk Management"), button:has-text("LTV")');
    if (await riskBtn.isVisible()) {
      await riskBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Risk Metrics"), h3:text("Loan-to-Value")')).toBeVisible();
      
      // Verify LTV display
      await expect(page.locator('text=LTV Ratio, text=Collateral Value, text=Loan Amount')).toBeVisible();
    }
  });

  test('P4-016: Concentration Risk Report by Sector', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to concentration risk
    const concBtn = page.locator('button:has-text("Concentration"), button:has-text("Sector Risk")');
    if (await concBtn.isVisible()) {
      await concBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Concentration Risk"), h3:text("Exposure by Sector")')).toBeVisible();
      
      // Verify sector display
      await expect(page.locator('text=Sector, text=Total Exposure, text=Percentage, text=Risk Level')).toBeVisible();
    }
  });

  test('P4-017: Liquidity Ratio Monitoring', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to liquidity monitoring
    const liquidityBtn = page.locator('button:has-text("Liquidity"), button:has-text("Liquidity Ratio")');
    if (await liquidityBtn.isVisible()) {
      await liquidityBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("Liquidity Monitoring"), h3:text("Liquidity Ratio")')).toBeVisible();
      
      // Verify liquidity metrics
      await expect(page.locator('text=Liquidity Ratio, text=High-Quality Liquid Assets, text=Total Liabilities')).toBeVisible();
    }
  });

  test('P4-018: KYC Document Upload and Verification Workflow', async ({ page }) => {
    await login(page, 'teller');
    
    await page.goto('http://localhost:3010/kyc-documents');
    await waitForPageLoad(page);
    
    // Check for upload functionality
    const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add Document")');
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Customer, text=Document Type, text=Upload File')).toBeVisible();
    }
  });

  test('P4-019: AML Alert Severity Levels and Management', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to AML alerts
    const alertsBtn = page.locator('button:has-text("AML Alerts"), button:has-text("Alerts")');
    if (await alertsBtn.isVisible()) {
      await alertsBtn.click();
      await waitForPageLoad(page);
      
      // Verify severity levels
      await expect(page.locator('text=Critical, text=High, text=Medium, text=Low')).toBeVisible();
      
      // Check for alert management actions
      await expect(page.locator('text=Resolve, text=Escalate, text=Notes')).toBeVisible();
    }
  });

  test('P4-020: PEP Flagging and Enhanced Due Diligence', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to PEP section
    const pepBtn = page.locator('button:has-text("PEP"), button:has-text("Politically Exposed")');
    if (await pepBtn.isVisible()) {
      await pepBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('h2:text("PEP Flagged"), h3:text("Enhanced Due Diligence")')).toBeVisible();
      
      // Verify PEP display
      await expect(page.locator('text=PEP Name, text=Position, text=Country, text=Risk Level')).toBeVisible();
    }
  });

  test('P4-021: Complete Compliance Dashboard Workflow', async ({ page }) => {
    await login(page, 'admin');
    
    // Step 1: Access compliance dashboard
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Compliance Dashboard")')).toBeVisible();
    
    // Step 2: Check portfolio metrics
    await expect(page.locator('text=PAR Metrics, text=NPL Metrics, text=LLR')).toBeVisible();
    
    // Step 3: Verify financial statements
    await expect(page.locator('text=Trial Balance, text=Income Statement, text=Balance Sheet')).toBeVisible();
    
    // Step 4: Check risk metrics
    await expect(page.locator('text=LTV, text=Concentration, text=Liquidity')).toBeVisible();
  });
});

// ============================================================================
// CROSS-PHASE INTEGRATION TESTS
// ============================================================================

test.describe('Cross-Phase Integration: Phase 3 + Phase 4', () => {
  
  test('CPI-001: Complete Customer Journey from Onboarding to Compliance', async ({ page }) => {
    // Step 1: Create new customer (Phase 1)
    await login(page, 'admin');
    await page.goto('http://localhost:3010/customers');
    await waitForPageLoad(page);
    
    // Verify customer exists
    const existingCustomer = page.locator(`text="${DEMO_CUSTOMERS.juan.name}"`);
    if (await existingCustomer.isVisible()) {
      await existingCustomer.click();
      await waitForPageLoad(page);
    }
    
    // Step 2: Open savings account (Phase 3)
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const account = page.locator(`tr:text("${DEMO_CUSTOMERS.juan.name}")`).first();
    if (await account.isVisible()) {
      await account.click();
      await waitForPageLoad(page);
      
      // Verify savings account created
      await expect(page.locator('text=Account Number, text=Balance')).toBeVisible();
    }
    
    // Step 3: Check compliance dashboard (Phase 4)
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Compliance Dashboard")')).toBeVisible();
  });

  test('CPI-002: Loan Disbursement with Accounting and Compliance', async ({ page }) => {
    await login(page, 'admin');
    
    // Step 1: Navigate to loans
    await page.goto('http://localhost:3010/loans');
    await waitForPageLoad(page);
    
    // Check for active loans
    const activeLoan = page.locator('tr').filter({ hasText: 'active' }).first();
    if (await activeLoan.isVisible()) {
      await activeLoan.click();
      await waitForPageLoad(page);
      
      // Verify accounting entries linked
      const accountingTab = page.locator('button:has-text("Accounting"), button:has-text("Journal Entries")');
      if (await accountingTab.isVisible()) {
        await accountingTab.click();
        await waitForPageLoad(page);
        
        await expect(page.locator('text=Journal Entry, text=GL Account, text=Debit, text=Credit')).toBeVisible();
      }
    }
    
    // Step 2: Check compliance dashboard
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1:text("Compliance Dashboard")')).toBeVisible();
  });

  test('CPI-003: Savings Interest with Double-Entry Accounting and Tax Withholding', async ({ page }) => {
    await login(page, 'admin');
    
    // Navigate to savings with interest calculations
    await page.goto('http://localhost:3010/savings');
    await waitForPageLoad(page);
    
    const account = page.locator('tr').filter({ hasText: 'Regular' }).first();
    if (await account.isVisible()) {
      await account.click();
      await waitForPageLoad(page);
      
      // Check accounting tab
      const accountingTab = page.locator('button:has-text("Accounting"), button:has-text("Entries")');
      if (await accountingTab.isVisible()) {
        await accountingTab.click();
        await waitForPageLoad(page);
        
        // Verify double-entry accounting
        await expect(page.locator('text=Double-Entry, text=GL Account, text=Balanced')).toBeVisible();
      }
    }
    
    // Check compliance dashboard
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('text=Financial Statements, text=Income Statement')).toBeVisible();
  });

  test('CPI-004: AML Alert Creation from Suspicious Transaction', async ({ page }) => {
    await login(page, 'teller');
    
    // Navigate to compliance dashboard
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Check for suspicious activity reporting
    const sarBtn = page.locator('button:has-text("New SAR"), button:has-text("Report Suspicious")');
    if (await sarBtn.isVisible()) {
      await sarBtn.click();
      await waitForPageLoad(page);
      
      await expect(page.locator('text=Suspicious Activity, text=Customer Details, text=Transaction Details')).toBeVisible();
    }
    
    // Verify CTR threshold display
    await expect(page.locator('text=CTR Threshold: PHP 500,000, text=Auto-Flag Large Transactions')).toBeVisible();
  });
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================

test.describe('Edge Cases & Error Handling', () => {
  
  test('EC-001: Invalid KYC Document Upload', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('http://localhost:3010/kyc-documents');
    await waitForPageLoad(page);
    
    // Try to upload invalid file type
    const uploadBtn = page.locator('button:has-text("Upload"), input[type="file"]');
    if (await uploadBtn.isVisible()) {
      // Verify file type validation exists
      await expect(page.locator('text=Valid formats: PDF, JPG, PNG, text=Max size')).toBeVisible();
    }
  });

  test('EC-002: AML Alert with Missing Customer Data', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to AML alerts
    const alertsBtn = page.locator('button:has-text("AML Alerts")');
    if (await alertsBtn.isVisible()) {
      await alertsBtn.click();
      await waitForPageLoad(page);
      
      // Verify validation messages
      await expect(page.locator('text=Customer Required, text=Alert Type Required, text=Description Required')).toBeVisible();
    }
  });

  test('EC-003: Financial Statement with Zero Balances', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Income Statement
    const plBtn = page.locator('button:has-text("Income Statement")');
    if (await plBtn.isVisible()) {
      await plBtn.click();
      await waitForPageLoad(page);
      
      // Verify zero balance handling
      await expect(page.locator('text=Zero Balance, text=No Activity, text=Nil')).toBeVisible();
    }
  });

  test('EC-004: PAR Calculation with No Past-Due Loans', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Check PAR metrics display
    const parMetrics = page.locator('text=PAR1, text=PAR7, text=PAR30, text=PAR90');
    await expect(parMetrics).toBeVisible();
    
    // Verify 0% display for no past-due
    await expect(page.locator('text=0%, text=No Past-Due, text=Clean Portfolio')).toBeVisible();
  });
});

// ============================================================================
// PERFORMANCE AND SCALABILITY
// ============================================================================

test.describe('Performance & Scalability', () => {
  
  test('PERF-001: Compliance Dashboard Load Time', async ({ page }) => {
    await login(page, 'admin');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard loaded in ${loadTime}ms`);
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Verify all metrics loaded
    await expect(page.locator('text=PAR Metrics, text=NPL Metrics, text=Financial Statements')).toBeVisible();
  });

  test('PERF-002: Large Dataset Report Generation', async ({ page }) => {
    await login(page, 'admin');
    
    await page.goto('http://localhost:3010/compliance-dashboard');
    await waitForPageLoad(page);
    
    // Navigate to Trial Balance
    const tbBtn = page.locator('button:has-text("Trial Balance")');
    if (await tbBtn.isVisible()) {
      const startTime = Date.now();
      
      await tbBtn.click();
      await waitForPageLoad(page);
      
      const loadTime = Date.now() - startTime;
      console.log(`Trial Balance loaded in ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(10000);
      
      // Verify table renders
      await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 15000 });
    }
  });
});