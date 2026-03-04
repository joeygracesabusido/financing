import { test, expect } from '@playwright/test';

test.describe('Phase 2.2 - Navigation Diagnostics', () => {
  test('Check loans page navigation and content', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const title = await page.locator('h1').textContent();
    console.log('Page title:', title);

    const bodyText = await page.locator('body').textContent();
    console.log('Body text snippet:', bodyText?.substring(0, 200));

    const buttons = await page.locator('button').all();
    console.log('Number of buttons:', buttons.length);

    await page.screenshot({ path: '/tmp/loans-page.png', fullPage: true });
    console.log('Screenshot saved to /tmp/loans-page.png');

    await expect(page).toHaveTitle(/Lending|loans/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Check if login is required', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const loginButton = page.locator('button:has-text("Login")').or(page.locator('text=Login'));
    const isLoggedIn = await loginButton.isVisible({ timeout: 2000 });

    console.log('Login button visible:', isLoggedIn);

    if (isLoggedIn) {
      await loginButton.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
      console.log('Navigated to login page');
    }

    const title = await page.locator('h1').textContent();
    console.log('Current page title:', title);
  });
});
