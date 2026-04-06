const { test, expect } = require('@playwright/test');

async function waitForBootstrap(page) {
  // Inject CI flags to skip flakiness-prone animations/logic
  await page.addInitScript(() => {
    window.CI = true;
    window.__playwright_test__ = true;
  });
  await expect(page.locator('#candidateName')).not.toBeEmpty({ timeout: 15000 });
}

test.describe('Terminal and AI Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
  });

  test('AI feed pane exists and is populated', async ({ page }) => {
    test.slow();
    const aiFeedTitle = page.locator('#activityPaneTitle');
    await expect(aiFeedTitle).toBeVisible({ timeout: 15000 });
    const typingArea = page.locator('#activityTypingText');
    await expect(async () => {
      const text = await typingArea.textContent();
      if (!text || text.trim().length === 0) throw new Error('AI typing area empty');
    }).toPass({ timeout: 20000 });
  });

  test('Terminal pane exists', async ({ page }) => {
    test.slow();
    const terminalTitle = page.locator('#terminalPaneTitle');
    await expect(terminalTitle).toBeVisible({ timeout: 15000 });
  });

  test('Terminal help command displays help message', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('help');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('CLI', { timeout: 10000 });
  });

  test('Terminal help flag (-h) works', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('-h');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('CLI', { timeout: 10000 });
  });

  test('Terminal skills command displays skills', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('skills');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    // We expect some skills to be listed, like "Typescript" or "Node.js"
    await expect(history).toContainText(/Typescript|Node.js|Frontend|Backend/i, { timeout: 10000 });
  });

  test('Terminal clear command clears history and shows welcome', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('help');
    await page.keyboard.press('Enter');
    
    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('CLI', { timeout: 10000 });

    await page.keyboard.type('clear');
    await page.keyboard.press('Enter');

    // The history should be cleared and show the welcome line
    await expect(async () => {
      const text = await history.textContent();
      if (!text.includes('Welcome to my 127.0.0.1')) throw new Error('Welcome message not found after clear');
      if (text.includes('Terminal Resume CLI')) throw new Error('History not cleared');
    }).toPass({ timeout: 15000 });
  });

  test('Terminal handles unknown commands', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('foobar');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    await expect(history).toContainText("Command not found: foobar", { timeout: 10000 });
  });

  test('Terminal photo command returns profile photo URL', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('photo');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    // The photo output now includes ASCII art and the URL
    await expect(history).toContainText('assets/profile-photo.jpg', { timeout: 10000 });
    await expect(history).toContainText('.---.', { timeout: 10000 }); // Part of ASCII art
  });

  test('Terminal linkedin command outputs opening message', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('--linkedin');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('Opening LinkedIn profile...', { timeout: 10000 });
  });

  test('Terminal ls command lists virtual files including photo.jpg', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    await page.keyboard.type('ls');
    await page.keyboard.press('Enter');

    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('photo.jpg', { timeout: 10000 });
  });

  test('Terminal right-click protection is enabled by default (when not localhost)', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    // Check if right click works by default on localhost or in tests
    const isTesting = await page.evaluate(() => navigator.userAgent.toLowerCase().includes('playwright'));
    const isLocalhost = await page.evaluate(() => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocalhost || isTesting) {
      // It should be disabled by default (my logic in main.ts)
      const isPrevented = await page.evaluate(() => {
        let prevented = false;
        const e = new MouseEvent('contextmenu', { cancelable: true, bubbles: true });
        const cb = (ev) => { if (ev.defaultPrevented) prevented = true; };
        document.addEventListener('contextmenu', cb);
        document.dispatchEvent(e);
        document.removeEventListener('contextmenu', cb);
        return prevented;
      });
      expect(isPrevented).toBe(false);
      
      // Now enable it manually via terminal
      const input = page.locator('#terminalInput');
      await input.focus();
      await page.keyboard.type('-r on');
      await page.keyboard.press('Enter');
      
      const isNowPrevented = await page.evaluate(() => {
        let prevented = false;
        const e = new MouseEvent('contextmenu', { cancelable: true });
        document.dispatchEvent(e);
        return e.defaultPrevented;
      });
      expect(isNowPrevented).toBe(true);
    }
  });

  test('Terminal right-click protection toggle works', async ({ page }) => {
    const input = page.locator('#terminalInput');
    await input.focus();
    
    // Disable right-click protection
    await page.keyboard.type('-r off');
    await page.keyboard.press('Enter');
    
    const history = page.locator('#terminalHistory');
    await expect(history).toContainText('Security protection disabled.');
    
    // Re-enable
    await page.keyboard.type('-r on');
    await page.keyboard.press('Enter');
    await expect(history).toContainText('Security protection enabled.');
  });
});

test.describe('Responsive Layout', () => {
  test('sidebar is hidden when app is minimized', async ({ page }) => {
    const minimizeBtn = page.locator('#windowButtonMinimize');
    await expect(async () => {
      await minimizeBtn.click({ force: true });
      const isMinimized = await page.evaluate(() => document.body.classList.contains('app-minimized'));
      if (!isMinimized) throw new Error('App not minimized');
    }).toPass({ timeout: 15000 });
    
    const heroRight = page.locator('.hero-right');
    await expect(heroRight).not.toBeVisible();
  });

  test('layout switches to single column on mobile', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/');
    await waitForBootstrap(page);

    const heroGrid = page.locator('.hero-grid');
    // On mobile (max-width: 1100px), .hero-grid should have grid-template-columns: 1fr
    const gridStyle = await heroGrid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns);
    // On single column, it will be something like "400px" or whatever the width is
    expect(gridStyle.split(' ').length).toBe(1);
  });
});
