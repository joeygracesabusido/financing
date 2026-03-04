import { test, expect } from '@playwright/test';

test.describe('Notification Preferences Page', () => {
  test('should display notification preferences page', async ({ page }) => {
    await page.goto('http://localhost:3010/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('h4 >> text="Notification Preferences"')).toBeVisible();
    await expect(page.locator('h6 >> text="Configure how you receive notifications"')).toBeVisible();
  });

  test('should have all three notification channels', async ({ page }) => {
    await page.goto('http://localhost:3010/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('text="Email Notifications"')).toBeVisible();
    await expect(page.locator('text="SMS Notifications"')).toBeVisible();
    await expect(page.locator('text="Push Notifications"')).toBeVisible();
  });

  test('should have save preferences button', async ({ page }) => {
    await page.goto('http://localhost:3010/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('button >> text="Save Preferences"')).toBeVisible();
  });

  test('should have cancel button', async ({ page }) => {
    await page.goto('http://localhost:3010/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('button >> text="Cancel"')).toBeVisible();
  });

  test('should show success notification after save', async ({ page }) => {
    await page.goto('http://localhost:3010/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await page.click('button >> text="Save Preferences"');
    
    await expect(page.locator('alert >> text="Notification preferences saved successfully!"')).toBeVisible({ timeout: 10000 });
  });
});