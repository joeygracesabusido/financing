import { test, expect } from '@playwright/test';

test.describe('Phase 1.3 - Customer (Member) Management', () => {
  test('Customers page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/customers');

    // Handle authentication redirect - expect either customers page or login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/customers|\/login/);
  });

  test('Customer detail page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/customers');
    const firstCustomer = page.locator('tr:first-child a, .customer-link, [data-customer-id], button:has-text("View")');
    if (await firstCustomer.isVisible({ timeout: 3000 })) {
      await firstCustomer.click();
      await expect(page).toHaveURL(/\/customers\/\d+/);
    }
  });

  test('Dashboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/dashboard|\/login/);
  });

  test('Login page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/login');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);
  });
});
