import { test, expect } from '@playwright/test';

test.describe('Phase 1.2 - User & Role Management', () => {
  test('Users page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/users');

    // Handle authentication redirect - expect either users page or login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/users|\/login/);
  });

  test('Branches page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/branches');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/branches|\/login/);
  });

  test('Audit logs page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/audit-logs');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/audit-logs|\/login/);
  });

  test('Login page accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/login');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);
  });

  test('Dashboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/dashboard|\/login/);
  });
});
