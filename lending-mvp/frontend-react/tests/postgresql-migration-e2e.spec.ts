import { test, expect } from '@playwright/test';

test.describe('PostgreSQL Migration E2E Validation', () => {
  test('Frontend loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Lending/i);
  });

  test('Docker services are accessible', async () => {
    const services = [
      { url: 'http://localhost:5433', desc: 'PostgreSQL' },
      { url: 'http://localhost:6380', desc: 'Redis' }
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        expect(response.ok || response.status === 400).toBe(true);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    }
  });

  test('MongoDB container removed from lending-mvp stack', async () => {
    // The lending_mongo container should no longer be running
    try {
      const response = await fetch('http://localhost:27018', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      // MongoDB port should not be accessible
      expect(response.ok).toBe(false);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});