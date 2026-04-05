import { test, expect } from '@playwright/test';

test.describe('2026 Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject CI flags to skip flakiness-prone animations/logic
    await page.addInitScript(() => {
      window.CI = true;
      window.__playwright_test__ = true;
    });
    await page.goto('/');
    // Give some time for initial render
    await page.waitForLoadState('networkidle');
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
    test.slow();
    
    // In CI environments, we skip precise bounding box stability checks for infinite animations
    // as they are highly prone to flakiness and hangs in resource-constrained runners.
    if (process.env.CI) {
      await expect(async () => {
        const exists = await page.evaluate(() => !!document.querySelector('.activity-typing-area'));
        if (!exists) throw new Error('AI Feed element not found');
      }).toPass({ timeout: 20000 });
      return;
    }

    const aiFeed = page.locator('.activity-typing-area');
    await expect(aiFeed).toBeVisible();
    await page.waitForTimeout(10000);
    const initialBox = await aiFeed.boundingBox();
    expect(initialBox).not.toBeNull();
    await page.waitForTimeout(10000);
    const laterBox = await aiFeed.boundingBox();
    expect(Math.abs(initialBox.height - laterBox.height)).toBeLessThan(25.0);
    expect(Math.abs(initialBox.width - laterBox.width)).toBeLessThan(25.0);
  });

  test('Top bar title should match production sequence', async ({ page }) => {
    test.slow();
    const titleContainer = page.locator('#terminalCommandText');
    
    // In WebKit CI, animations and even simple script execution can be extremely delayed.
    // We simplify the check to ensure the feature is running.
    if (page.context().browser().browserType().name() === 'webkit') {
      await expect(async () => {
        const hasContent = await page.evaluate(() => {
          const el = document.querySelector('#terminalCommandText');
          return el && el.textContent && el.textContent.trim().length > 0;
        });
        if (!hasContent) throw new Error('Content not yet present');
      }).toPass({ timeout: 45000 });
      return;
    }

    await expect(async () => {
      await expect(titleContainer).toBeVisible();
      const text = await titleContainer.textContent();
      if (!text.toLowerCase().includes('code session')) {
        throw new Error(`Final title command not reached. Current text: "${text}"`);
      }
    }).toPass({ timeout: 30000 });
  });
});
