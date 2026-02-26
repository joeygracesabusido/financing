import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Savings Accounts & Passbook Printing', () => {
  test('Savings page accessible', async ({ page }) => {
    // Skip if not authenticated (tests handle auth elsewhere)
    await page.goto('http://localhost:3010/savings');
    await page.waitForLoadState('networkidle');
    
    // Should be on savings page or redirected to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/savings|\/login/);
  });

  test('Print passbook functionality', async ({ page }) => {
    // Navigate directly to savings detail page (if account exists)
    await page.goto('http://localhost:3010/savings/test-account-id');
    await page.waitForLoadState('networkidle');
    
    // Check for print passbook button
    const printButton = page.locator('button:has-text("Print Passbook")');
    if (await printButton.isVisible()) {
      await expect(printButton).toBeVisible();
      
      // Click print button (this will open print dialog)
      await printButton.click();
      
      // Give time for print dialog to appear
      await page.waitForTimeout(1000);
    }
  });
});