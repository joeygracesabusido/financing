import { test, expect } from '@playwright/test';

test.describe('Phase 2.2 - Loans Page Investigation', () => {
  test('Investigate loans page content', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    await page.screenshot({ path: '/tmp/loans-page-full.png', fullPage: true });

    const content = await page.content();
    console.log('Page content length:', content.length);

    const h1Count = (content.match(/<h1>/g) || []).length;
    console.log('Number of h1 elements:', h1Count);

    const buttons = await page.locator('button').all();
    console.log('Total buttons:', buttons.length);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}:`, text?.trim());
    }

    const headers = await page.locator('h1, h2, h3').all();
    console.log('Total headers:', headers.length);
    for (let i = 0; i < Math.min(headers.length, 10); i++) {
      const text = await headers[i].textContent();
      console.log(`Header ${i}: ${text?.trim()}`);
    }

    const cards = await page.locator('.glass, [class*="card"], [class*="pipeline"]').all();
    console.log('Potential cards:', cards.length);
  });
});
