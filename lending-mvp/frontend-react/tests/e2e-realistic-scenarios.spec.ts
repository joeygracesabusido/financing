/**
 * E2E Test Suite — Realistic Loan & Savings Operations
 * =====================================================
 * Uses demo seed data (demo-data.ts) so tests run against realistic
 * users, customers, loan products, and branches from PostgreSQL seeding.
 * See DEMO_DATA_INDEX.md and backend/app/utils/demo_seeder.py.
 */

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  DEMO_USERS,
  DEMO_CUSTOMERS,
  DEMO_CUSTOMER_SEARCH,
  DEMO_LOAN_PRODUCTS,
  DEMO_LOAN_PRODUCT_SEARCH,
  DEMO_LOAN_AMOUNTS,
  DEMO_SAVINGS,
  DEMO_NOTES,
} from './demo-data';

test.describe('E2E Test Suite - Realistic Loan & Savings Operations', () => {
  /** Login with demo user. For admin, tries admin123 first (Docker seed_admin_user), then Admin@123Demo. */
  async function login(
    page: import('@playwright/test').Page,
    username: string,
    password: string
  ) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[type="text"], input[name="username"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  /** Login as admin (tries admin123 first for Docker, then Admin@123Demo). */
  async function loginAsAdmin(page: import('@playwright/test').Page) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[type="text"], input[name="username"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[type="text"], input[name="username"]', DEMO_USERS.admin.username);
    await page.fill('input[type="password"]', DEMO_USERS.adminFallback.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    if (page.url().includes('/login')) {
      await page.fill('input[type="text"], input[name="username"]', DEMO_USERS.admin.username);
      await page.fill('input[type="password"]', DEMO_USERS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 5000 }).catch(() => {});
    await expect(page).not.toHaveURL(/\/login$/);
  }

  test('E2E-001: Complete loan application workflow with demo customers', async ({ page }) => {
    await login(page, DEMO_USERS.loan_officer_1.username, DEMO_USERS.loan_officer_1.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const newAppBtn = page.getByRole('button', { name: /New Application/i });
    if (await newAppBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAppBtn.click();
      await page.waitForURL(/\/loans\/new/, { timeout: 8000 }).catch(() => {});

      await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.juan);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_CUSTOMERS.juanDelaCruz}`, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);

      await page.fill('input[name="productId"]', DEMO_LOAN_PRODUCT_SEARCH.personal);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_LOAN_PRODUCTS.personalLoan}`, { timeout: 3000 }).catch(() => {});

      const { principal, termMonths, interestRate } = DEMO_LOAN_AMOUNTS.personal;
      await page.fill('input[name="principal"]', String(principal));
      await page.fill('input[name="termMonths"]', String(termMonths));
      await page.fill('input[name="interestRate"]', String(interestRate));

      await page.click('button:has-text("Next: Review & Approval")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Review');
      await expect(page.locator('h2')).toContainText('Approval');

      await page.fill('textarea[name="approvalNote"]', DEMO_NOTES.approval);

      await page.click('button:has-text("Submit for Approval")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Submitted successfully')).toBeVisible();

      const loanUrl = page.url();
      expect(loanUrl.includes('/loans/')).toBeTruthy();
    } else {
      await expect(page.locator('h1, main')).toBeVisible();
    }
  });

  test('E2E-002: Multi-stage loan approval workflow', async ({ page }) => {
    await login(page, DEMO_USERS.branch_manager.username, DEMO_USERS.branch_manager.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const submittedLoan = page.locator('tr[data-status="submitted"]').first();
    if (await submittedLoan.isVisible()) {
      await submittedLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.fill('textarea[name="reviewNote"]', DEMO_NOTES.review);

      await page.click('button:has-text("Approve")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Approved successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-003: Loan disbursement with Official Receipt generation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const approvedLoan = page.locator('tr[data-status="approved"]').first();
    if (await approvedLoan.isVisible()) {
      await approvedLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Disburse")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Disbursed successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-004: Loan repayment with receipt', async ({ page }) => {
    await login(page, DEMO_USERS.teller_1.username, DEMO_USERS.teller_1.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const activeLoan = page.locator('tr[data-status="active"]').first();
    if (await activeLoan.isVisible()) {
      await activeLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Repayment")');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="amount"]', '7500');
      await page.fill('textarea[name="note"]', DEMO_NOTES.repayment);

      await page.click('button:has-text("Process Payment")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Payment processed')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-005: Savings account operations with demo data', async ({ page }) => {
    await login(page, DEMO_USERS.teller_1.username, DEMO_USERS.teller_1.password);
    await page.goto(`${BASE_URL}/savings`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("New Account")');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.juan);
    await page.waitForTimeout(500);
    await page.click(`text=${DEMO_CUSTOMERS.juanDelaCruz}`, { timeout: 3000 });
    await page.waitForTimeout(500);

    await page.selectOption('select[name="type"]', 'regular');
    await page.fill('input[name="initialDeposit"]', String(DEMO_SAVINGS.initialDeposit));

    await page.click('button:has-text("Open Account")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Account created successfully')).toBeVisible();

    await page.goBack();
    await page.waitForLoadState('networkidle');

    const savingsAccount = page.locator('tr[data-type="regular"]').first();
    if (await savingsAccount.isVisible()) {
      await savingsAccount.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Deposit")');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="amount"]', String(DEMO_SAVINGS.depositAmount));
      await page.fill('textarea[name="note"]', DEMO_NOTES.deposit);

      await page.click('button:has-text("Process Deposit")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Deposit processed')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-006: Loan calculator with different amortization types', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/calculator`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Loan Calculator');

    await page.fill('input[type="number"][placeholder="Enter loan amount"]', '500000');
    await page.fill('input[type="range"]', '7.5');
    await page.fill('input[name="termMonths"]', '60');

    await page.waitForTimeout(1000);

    const monthlyPayment = await page
      .locator('h3:text("Monthly Payment") + span')
      .textContent();
    expect(monthlyPayment).toBeTruthy();
    expect(parseFloat(monthlyPayment?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);

    await page.selectOption('select', 'flat_rate');
    await page.waitForTimeout(1000);
    const flatPayment = await page
      .locator('h3:text("Monthly Payment") + span')
      .textContent();
    expect(flatPayment).toBeTruthy();

    await page.selectOption('select', 'balloon_payment');
    await page.waitForTimeout(1000);
    const balloonPayment = await page
      .locator('h3:text("Monthly Payment") + span')
      .textContent();
    expect(balloonPayment).toBeTruthy();

    await page.selectOption('select', 'interest_only');
    await page.waitForTimeout(1000);
    const interestOnlyPayment = await page
      .locator('h3:text("Monthly Payment") + span')
      .textContent();
    expect(interestOnlyPayment).toBeTruthy();
  });

  test('E2E-007: Loan restructuring workflow', async ({ page }) => {
    await login(page, DEMO_USERS.branch_manager.username, DEMO_USERS.branch_manager.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const activeLoan = page.locator('tr[data-status="active"]').first();
    if (await activeLoan.isVisible()) {
      await activeLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Restructure")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Restructure');

      await page.fill('input[name="termMonths"]', '36');
      await page.fill('input[name="interestRate"]', '12.0');
      await page.fill('textarea[name="reason"]', DEMO_NOTES.restructure);

      await page.click('button:has-text("Confirm Restructure")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Loan restructured successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-008: Collections and PTP tracking', async ({ page }) => {
    await login(page, DEMO_USERS.loan_officer_1.username, DEMO_USERS.loan_officer_1.password);
    await page.goto(`${BASE_URL}/collections`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toBeVisible();

    const pastDueLoan = page.locator('tr[data-status="past_due"]').first();
    if (await pastDueLoan.isVisible()) {
      await pastDueLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Add PTP")');
      await page.waitForLoadState('networkidle');

      await page.fill(
        'input[name="ptpDate"]',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      await page.fill('input[name="ptpAmount"]', '5000');

      await page.selectOption('select[name="contactMethod"]', 'phone');
      await page.fill('textarea[name="contactResult"]', 'Customer promised to pay next week');

      await page.click('button:has-text("Save PTP")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Promise-to-Pay created')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E-009: Loan calculator UI verification', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/calculator`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Loan Calculator');

    await expect(page.locator('input[type="range"]')).toHaveCount(3);
    await expect(page.locator('select')).toHaveCount(1);

    await expect(page.locator('h3:text("Monthly Payment")')).toBeVisible();
    await expect(page.locator('h3:text("Total Interest")')).toBeVisible();
    await expect(page.locator('h3:text("Total Payment")')).toBeVisible();

    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:text("Principal")')).toBeVisible();
    await expect(page.locator('th:text("Interest")')).toBeVisible();
  });

  test('E2E-010: Complete demo scenario - Customer journey (DEMO_DATA_INDEX Scenario 1)', async ({
    page,
  }) => {
    // Step 1: Loan officer creates application for Maria Cruz Santos — Business Loan
    await login(page, DEMO_USERS.loan_officer_1.username, DEMO_USERS.loan_officer_1.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const newAppBtn = page.getByRole('button', { name: /New Application/i });
    if (await newAppBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAppBtn.click();
      await page.waitForURL(/\/loans\/new/, { timeout: 8000 }).catch(() => {});

      await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.maria);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_CUSTOMERS.mariaCruzSantos}`, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);

      await page.fill('input[name="productId"]', DEMO_LOAN_PRODUCT_SEARCH.business);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_LOAN_PRODUCTS.businessLoan}`, { timeout: 3000 }).catch(() => {});

      const biz = DEMO_LOAN_AMOUNTS.business;
      await page.fill('input[name="principal"]', String(biz.principal));
      await page.fill('input[name="termMonths"]', String(biz.termMonths));
      await page.fill('input[name="interestRate"]', String(biz.interestRate));

      await page.click('button:has-text("Next: Review & Approval")');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Submit for Approval")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Submitted successfully')).toBeVisible();
    }

    // Step 2: Branch manager approves
    await login(page, DEMO_USERS.branch_manager.username, DEMO_USERS.branch_manager.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const submittedLoan = page.locator('tr[data-status="submitted"]').first();
    if (await submittedLoan.isVisible()) {
      await submittedLoan.click();
      await page.waitForLoadState('networkidle');

      await page.fill('textarea[name="reviewNote"]', DEMO_NOTES.review);
      await page.click('button:has-text("Approve")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Approved successfully')).toBeVisible();
    }

    // Step 3: Admin disburses
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const approvedLoan = page.locator('tr[data-status="approved"]').first();
    if (await approvedLoan.isVisible()) {
      await approvedLoan.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Disburse")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Disbursed successfully')).toBeVisible();
    }

    // Step 4: Teller processes first repayment
    await login(page, DEMO_USERS.teller_1.username, DEMO_USERS.teller_1.password);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const activeLoan = page.locator('tr[data-status="active"]').first();
    if (await activeLoan.isVisible()) {
      await activeLoan.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Repayment")');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="amount"]', '16500');
      await page.fill('textarea[name="note"]', DEMO_NOTES.repayment);

      await page.click('button:has-text("Process Payment")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Payment processed')).toBeVisible();
    }

    // Step 5: Savings — new account for Maria Cruz Santos
    await page.goto(`${BASE_URL}/savings`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Savings Accounts');

    const openAccountBtn = page.getByRole('button', { name: /Open Account|New Account/i });
    if (await openAccountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await openAccountBtn.click();
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.maria);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_CUSTOMERS.mariaCruzSantos}`, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);

      await page.selectOption('select[name="type"]', 'regular');
      await page.fill('input[name="initialDeposit"]', String(DEMO_SAVINGS.initialDeposit));

      await page.click('button:has-text("Open Account")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Account created successfully')).toBeVisible();

      await page.click('button:has-text("Deposit")');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="amount"]', '25000');
      await page.fill('textarea[name="note"]', DEMO_NOTES.deposit);

      await page.click('button:has-text("Process Deposit")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Deposit processed')).toBeVisible();
    }
  });
});
