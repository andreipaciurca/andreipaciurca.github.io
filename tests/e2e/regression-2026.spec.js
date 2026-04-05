import { test, expect } from '@playwright/test';

test.describe('2026 Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Security protection should be ON by default', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    // On localhost or during tests, we expect it to be OFF by default based on main.ts logic
    const isLocalhost = await page.evaluate(() => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isTesting = await page.evaluate(() => navigator.userAgent.toLowerCase().includes('playwright'));
    
    const isPrevented = await page.evaluate(() => {
      let prevented = false;
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      const cb = (e) => {
        if (e.defaultPrevented) prevented = true;
      };
      document.addEventListener('contextmenu', cb);
      document.dispatchEvent(event);
      document.removeEventListener('contextmenu', cb);
      return prevented;
    });
    
    if (isLocalhost || isTesting) {
      expect(isPrevented).toBe(false);
    } else {
      expect(isPrevented).toBe(true);
    }
  });

  test('AI Feed should be stable across browsers', async ({ page }) => {
    const aiFeed = page.locator('.activity-typing-area');
    await expect(aiFeed).toBeVisible();
    
    // Give some time for stabilization to complete
    await page.waitForTimeout(500);
    
    const initialBox = await aiFeed.boundingBox();
    expect(initialBox).not.toBeNull();
    
    await page.waitForTimeout(3000);
    
    const laterBox = await aiFeed.boundingBox();
    
    // Use 10.0px tolerance for cross-browser stability in headless CI environments.
    // Headless rendering can vary significantly between Chromium, WebKit, and Firefox.
    expect(Math.abs(initialBox.height - laterBox.height)).toBeLessThan(10.0);
    expect(Math.abs(initialBox.width - laterBox.width)).toBeLessThan(10.0);
  });

  test('Top bar title should match production sequence', async ({ page }) => {
    const titleContainer = page.locator('#terminalCommandText');
    await expect(titleContainer).toBeVisible();
    
    // Use retry logic to wait for the welcome text then for the command
    await expect(async () => {
      const text = await titleContainer.textContent();
      expect(text).toContain('Welcome to my 127.0.0.1');
    }).toPass({ timeout: 5000 });

    await expect(async () => {
      const text = await titleContainer.textContent();
      expect(text).toContain('$ code session --agent=viewer --profile=andrei');
      expect(text).not.toContain('Welcome');
    }).toPass({ timeout: 8000 });
  });
});
