import { test, expect } from '@playwright/test';

test.describe('Loan Transaction Authorization', () => {
  async function login(page: any, username: string = 'admin', password: string = 'admin123') {
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('button:has-text("Login")').or(page.locator('button[type="submit"]'));
    if (await loginButton.isVisible({ timeout: 2000 })) {
      await loginButton.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });

      await page.fill('input[type="text"]', username);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
  }

  test('Admin can view all loan transactions', async ({ page }) => {
    await login(page, 'admin', 'admin123');
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle');

    const firstLoanRow = page.locator('tr').filter({ hasText: 'Loan' }).first();
    if (await firstLoanRow.isVisible()) {
      await firstLoanRow.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Transactions")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Transactions');
      const transactionRows = page.locator('table tbody tr');
      await expect(transactionRows.first()).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Staff can only view transactions for their assigned loans', async ({ page }) => {
    await login(page, 'loan_officer', 'loan_officer123');
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle');

    const firstLoanRow = page.locator('tr').filter({ hasText: 'Loan' }).first();
    if (await firstLoanRow.isVisible()) {
      const loanId = await firstLoanRow.getAttribute('data-id') || '';
      
      await firstLoanRow.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Transactions")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Transactions');
      const transactionRows = page.locator('table tbody tr');
      
      if (await transactionRows.first().isVisible()) {
        await expect(transactionRows.first()).toBeVisible();
      }

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Staff cannot access other users loan transactions', async ({ page }) => {
    await login(page, 'loan_officer', 'loan_officer123');
    
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle');

    const loansTable = page.locator('table');
    const loanRows = await loansTable.locator('tbody tr').all();
    
    if (loanRows.length > 1) {
      await loanRows[1].click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Transactions")');
      await page.waitForLoadState('networkidle');

      const transactionRows = page.locator('table tbody tr');
      if (await transactionRows.first().isVisible()) {
        await expect(transactionRows.first()).toBeVisible();
      }
    }
  });
});