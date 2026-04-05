const { test, expect } = require('@playwright/test');

test.describe('AI Feed UI/UX TDD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#candidateName')).not.toBeEmpty({ timeout: 10000 });
  });

  test('AI feed font size should be 11px', async ({ page }) => {
    const typingArea = page.locator('.activity-typing-area');
    const fontSize = await typingArea.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('11px');
  });

  test('AI feed should have a stable height to avoid relayouts', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    const aiFeedPane = page.locator('.hero-right .nested-pane:nth-child(2)');
    
    // Give time for stabilization script to run
    await page.waitForTimeout(1000);
    
    const height = await aiFeedPane.evaluate((el) => el.getBoundingClientRect().height);
    
    // We expect it to be stable even after some time (typing happens)
    await page.waitForTimeout(2500);
    const newHeight = await aiFeedPane.evaluate((el) => el.getBoundingClientRect().height);
    
    // Use 5.0px tolerance to handle browser sub-pixel differences and CI rounding jitter
    expect(Math.abs(newHeight - height)).toBeLessThan(5.0);
  });
  
  test('AI feed should not clip content with 11px font', async ({ page }) => {
    const typingArea = page.locator('.activity-typing-area');
    const isClipped = await typingArea.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isClipped).toBe(false);
  });
});
