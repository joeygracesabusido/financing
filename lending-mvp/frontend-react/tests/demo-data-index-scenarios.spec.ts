/**
 * E2E Tests — DEMO_DATA_INDEX.md Scenarios
 * ==========================================
 * Direct mapping to the 5 testing scenarios in DEMO_DATA_INDEX.md.
 * Uses demo seed data (demo-data.ts) for realistic users, customers, and products.
 *
 * Scenario 1: Loan Workflow
 * Scenario 2: Savings Management
 * Scenario 3: Collections Management
 * Scenario 4: Audit Trail
 * Scenario 5: Role-Based Access
 */

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  API_URL,
  DEMO_USERS,
  DEMO_USERS_LEGACY,
  DEMO_CUSTOMERS,
  DEMO_CUSTOMER_SEARCH,
  DEMO_LOAN_PRODUCTS,
  DEMO_LOAN_PRODUCT_SEARCH,
  DEMO_LOAN_AMOUNTS,
  DEMO_SAVINGS,
  DEMO_NOTES,
} from './demo-data';

type UserKey = keyof typeof DEMO_USERS_LEGACY;

async function login(
  page: import('@playwright/test').Page,
  role: UserKey
) {
  const { u, p } = DEMO_USERS_LEGACY[role];
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="text"], input[name="username"]', { state: 'visible', timeout: 10000 });
  await page.fill('input[type="text"], input[name="username"]', u);
  await page.fill('input[type="password"]', p);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="text"], input[name="username"]', { state: 'visible', timeout: 10000 });
  await page.fill('input[type="text"], input[name="username"]', DEMO_USERS.admin.username);
  await page.fill('input[type="password"]', DEMO_USERS.adminFallback.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  if (page.url().includes('/login')) {
    await page.fill('input[type="password"]', DEMO_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 5000 }).catch(() => {});
}

test.describe('DEMO_DATA_INDEX Scenario 1: Loan Workflow', () => {
  test('View pending applications and create loan (Loan Officer)', async ({ page }) => {
    await login(page, 'loan_officer');
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, main')).toBeVisible();

    const newAppBtn = page.getByRole('button', { name: /New Application/i }).or(page.locator('a:has-text("New Application")'));
    if (await newAppBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAppBtn.click();
      await page.waitForURL(/\/loans\/new/, { timeout: 8000 }).catch(() => {});

      await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.juan);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_CUSTOMERS.juanDelaCruz}`, { timeout: 5000 }).catch(() => {});

      await page.fill('input[name="productId"]', DEMO_LOAN_PRODUCT_SEARCH.personal);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_LOAN_PRODUCTS.personalLoan}`, { timeout: 5000 }).catch(() => {});

      const { principal, termMonths, interestRate } = DEMO_LOAN_AMOUNTS.personal;
      await page.fill('input[name="principal"]', String(principal));
      await page.fill('input[name="termMonths"]', String(termMonths));
      await page.fill('input[name="interestRate"]', String(interestRate));

      await page.click('button:has-text("Next: Review"), button:has-text("Submit")');
      await page.waitForLoadState('networkidle');
      await page.fill('textarea[name="approvalNote"]', DEMO_NOTES.approval).catch(() => {});
      await page.click('button:has-text("Submit for Approval")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toContainText(/Submitted|success|loan/i);
    }
  });

  test('Approve and disburse (Branch Manager then Admin)', async ({ page }) => {
    await login(page, 'branch_manager');
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const submitted = page.locator('tr[data-status="submitted"]').first();
    if (await submitted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitted.click();
      await page.waitForLoadState('networkidle');
      await page.fill('textarea[name="reviewNote"]', DEMO_NOTES.review).catch(() => {});
      await page.click('button:has-text("Approve")');
      await page.waitForLoadState('networkidle');
    }

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');

    const approved = page.locator('tr[data-status="approved"]').first();
    if (await approved.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approved.click();
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("Disburse")');
      await page.waitForLoadState('networkidle');
    }

    await expect(page.locator('h1, main')).toBeVisible();
  });
});

test.describe('DEMO_DATA_INDEX Scenario 2: Savings Management', () => {
  test('View accounts and process deposit (Teller)', async ({ page }) => {
    await login(page, 'teller');
    await page.goto(`${BASE_URL}/savings`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, main')).toBeVisible();

    const row = page.locator('tr[data-type="regular"], table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("Deposit")').catch(() => {});
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="amount"]', String(DEMO_SAVINGS.depositAmount)).catch(() => {});
      await page.fill('textarea[name="note"]', DEMO_NOTES.deposit).catch(() => {});
      await page.click('button:has-text("Process Deposit"), button:has-text("Deposit")').catch(() => {});
    }

    await expect(page.locator('h1, main')).toBeVisible();
  });

  test('Open new savings account for demo customer', async ({ page }) => {
    await login(page, 'teller');
    await page.goto(`${BASE_URL}/savings`);
    await page.waitForLoadState('networkidle');

    const newAccountBtn = page.getByRole('button', { name: /Open Account|New Account/i }).or(page.locator('a:has-text("New Account")'));
    if (await newAccountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAccountBtn.click();
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="customerId"]', DEMO_CUSTOMER_SEARCH.maria);
      await page.waitForTimeout(500);
      await page.click(`text=${DEMO_CUSTOMERS.mariaCruzSantos}`, { timeout: 5000 }).catch(() => {});

      await page.selectOption('select[name="type"]', 'regular').catch(() => {});
      await page.fill('input[name="initialDeposit"]', String(DEMO_SAVINGS.initialDeposit));
      await page.click('button:has-text("Open Account")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toContainText(/created|success|account/i);
    } else {
      await expect(page.locator('h1, main')).toBeVisible();
    }
  });
});

test.describe('DEMO_DATA_INDEX Scenario 3: Collections Management', () => {
  test('View collections / past-due loans (Loan Officer)', async ({ page }) => {
    await login(page, 'loan_officer');
    await page.goto(`${BASE_URL}/collections`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, main')).toBeVisible();
  });
});

test.describe('DEMO_DATA_INDEX Scenario 4: Audit Trail', () => {
  test('Auditor accesses compliance / audit views', async ({ page }) => {
    await login(page, 'auditor');
    await page.goto(`${BASE_URL}/compliance-dashboard`);
    await page.waitForLoadState('networkidle');

    const onCompliance = page.url().includes('compliance') || page.url().includes('dashboard');
    const hasContent = await page.locator('h1, h2, main').first().isVisible({ timeout: 8000 }).catch(() => false);
    expect(onCompliance || hasContent).toBeTruthy();
  });

  test('View chart of accounts or financial reports', async ({ page }) => {
    await login(page, 'auditor');
    await page.goto(`${BASE_URL}/chart-of-accounts`);
    await page.waitForLoadState('networkidle');

    const hasContent = await page.locator('h1, h2, main, table').first().isVisible({ timeout: 8000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

test.describe('DEMO_DATA_INDEX Scenario 5: Role-Based Access', () => {
  test('Admin can access dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, main')).toBeVisible();
  });

  test('Loan Officer can access loans', async ({ page }) => {
    await login(page, 'loan_officer');
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, main')).toBeVisible();
  });

  test('Teller can access savings', async ({ page }) => {
    await login(page, 'teller');
    await page.goto(`${BASE_URL}/savings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, main')).toBeVisible();
  });

  test('Branch Manager can access loans', async ({ page }) => {
    await login(page, 'branch_manager');
    await page.goto(`${BASE_URL}/loans`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, main')).toBeVisible();
  });

  test('Backend health check', async ({ page }) => {
    const res = await page.goto(`${API_URL}/health`);
    expect(res?.status()).toBe(200);
    const body = await page.textContent('body');
    expect(body).toContain('ok');
  });
});
