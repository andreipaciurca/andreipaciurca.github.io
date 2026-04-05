/**
 * E2E tests for andreipaciurca.github.io
 *
 * Covers Chromium, WebKit (Safari), and Firefox via Playwright.
 * Run: npm run test:e2e
 * Prerequisites: npx playwright install
 */
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Wait for the JS modules to finish bootstrapping and initial render. */
async function waitForBootstrap(page) {
  // Inject CI flags to skip flakiness-prone animations/logic
  await page.addInitScript(() => {
    (window as any).CI = true;
    (window as any).__playwright_test__ = true;
  });
  await page.waitForLoadState('networkidle');
  // candidateName is set synchronously in renderPage() — if it has content the
  // module graph loaded and executed without error.
  await expect(page.locator('#candidateName')).not.toBeEmpty({ timeout: 15000 });
  // Extra stabilization time for slow CI environments (especially WebKit)
  await page.waitForTimeout(5000);
}

// ---------------------------------------------------------------------------
// Content Rendering
// ---------------------------------------------------------------------------
test.describe('Content Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
  });

  test('page title contains candidate name', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const title = await page.title();
      if (!/Andrei/.test(title)) throw new Error(`Title "${title}" does not match`);
    }).toPass({ timeout: 20000 });
  });

  test('candidate name is rendered', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const text = await page.locator('#candidateName').textContent();
      if (!text || text.trim().length === 0) throw new Error('Candidate name still empty');
    }).toPass({ timeout: 20000 });
  });

  test('hero role is rendered', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const text = await page.locator('#heroRole').textContent();
      if (!text || text.trim().length === 0) throw new Error('Hero role still empty');
    }).toPass({ timeout: 20000 });
  });

  test('status line is rendered', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const text = await page.locator('#statusLine').textContent();
      if (!text || text.trim().length === 0) throw new Error('Status line still empty');
    }).toPass({ timeout: 20000 });
  });

  test('hero summary types out text', async ({ page }) => {
    test.slow();
    // Use toPass for robustness in slow CI environments
    await expect(async () => {
      const text = await page.locator('#heroSummary').textContent();
      if (!text || text.trim().length === 0) throw new Error('Hero summary still empty');
    }).toPass({ timeout: 20000 });
  });

  test('correct number of experience cards rendered', async ({ page }) => {
    test.slow();
    const cards = page.locator('.experience-card');
    await expect(async () => {
      const count = await cards.count();
      if (count !== 4) throw new Error(`Found ${count} cards, expected 4`);
    }).toPass({ timeout: 20000 });
  });

  test('Correct number of skill chips are rendered', async ({ page }) => {
    test.slow();
    const chips = page.locator('.skill-chip');
    await expect(async () => {
      const count = await chips.count();
      if (count < 10) throw new Error(`Only ${count} chips found`);
    }).toPass({ timeout: 20000 });
  });

  test('contact links are present and not empty', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const email = await page.locator('#emailValue').textContent();
      const linkedin = await page.locator('#linkedinValue').textContent();
      const github = await page.locator('#githubValue').textContent();
      if (!email || !linkedin || !github) throw new Error('One or more contact links empty');
    }).toPass({ timeout: 20000 });
  });

  test('footer shows candidate name and current year', async ({ page }) => {
    test.slow();
    const year = String(new Date().getFullYear());
    await expect(async () => {
      const name = await page.locator('#footerName').textContent();
      const footerYear = await page.locator('#currentYear').textContent();
      if (!name || name.trim().length === 0) throw new Error('Footer name empty');
      if (footerYear !== year) throw new Error(`Expected year ${year}, found ${footerYear}`);
    }).toPass({ timeout: 20000 });
  });
});

// ---------------------------------------------------------------------------
// Download Resume Button
// ---------------------------------------------------------------------------
test.describe('Download Resume Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
  });

  test('download button is visible', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const isVisible = await page.locator('#downloadResumeBtn').isVisible();
      if (!isVisible) throw new Error('Download button not visible');
    }).toPass({ timeout: 20000 });
  });

  test('Correct number of pointer hands flank the button', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const count = await page.locator('.resume-pointer').count();
      if (count !== 2) throw new Error(`Found ${count} pointer hands, expected 2`);
    }).toPass({ timeout: 20000 });
  });

  test('pointer hands contain the expected Font Awesome icons', async ({ page }) => {
    test.slow();
    await expect(async () => {
      const rightVisible = await page.locator('.fa-hand-point-right').isVisible();
      const leftVisible = await page.locator('.fa-hand-point-left').isVisible();
      if (!rightVisible || !leftVisible) throw new Error('One or more pointer icons not visible');
    }).toPass({ timeout: 20000 });
  });
});

// ---------------------------------------------------------------------------
// Theme Toggle
// ---------------------------------------------------------------------------
test.describe('Theme Toggle', () => {
  test('starts in dark mode', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    await expect(async () => {
      const hasLightMode = await page.evaluate(() => document.body.classList.contains('light-mode'));
      if (hasLightMode) throw new Error('Should start in dark mode');
    }).toPass({ timeout: 15000 });
  });

  test('clicking theme toggle switches to light mode', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const body = page.locator('body');
    const toggle = page.locator('#themeToggleButton');
    
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await toggle.click({ force: true }).catch(() => {});
      await toggle.dispatchEvent('mousedown');
      await toggle.dispatchEvent('mouseup');
      await toggle.dispatchEvent('click');
      
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (!hasClass) throw new Error('light-mode class not found');
    }).toPass({ timeout: 25000 });
  });

  test('clicking theme toggle twice returns to dark mode', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    const body = page.locator('body');
    const toggle = page.locator('#themeToggleButton');
    
    // Switch to light
    await expect(async () => {
      await page.waitForTimeout(2000);
      await toggle.click({ force: true }).catch(() => {});
      await toggle.dispatchEvent('click');
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (!hasClass) throw new Error('light-mode class not found after first click');
    }).toPass({ timeout: 20000 });
    
    // Switch back to dark
    await expect(async () => {
      await page.waitForTimeout(2000);
      await toggle.click({ force: true }).catch(() => {});
      await toggle.dispatchEvent('click');
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (hasClass) throw new Error('light-mode class still present after second click');
    }).toPass({ timeout: 20000 });
  });
});

// ---------------------------------------------------------------------------
// App Window Controls
// ---------------------------------------------------------------------------
test.describe('App Window Controls', () => {
  test('close button collapses app to launcher', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const closeBtn = page.locator('#windowButtonClose');
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await closeBtn.click({ force: true }).catch(() => {});
      await closeBtn.dispatchEvent('mousedown');
      await closeBtn.dispatchEvent('mouseup');
      await closeBtn.dispatchEvent('click');
      const isCollapsed = await page.evaluate(() => document.body.classList.contains('app-collapsed'));
      if (!isCollapsed) throw new Error('App not collapsed after close click');
    }).toPass({ timeout: 20000 });
  });

  test('clicking launcher card reopens the app', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const closeBtn = page.locator('#windowButtonClose');
    await expect(async () => {
      await page.waitForTimeout(2000);
      await closeBtn.click({ force: true }).catch(() => {});
      await closeBtn.dispatchEvent('click');
      const isCollapsed = await page.evaluate(() => document.body.classList.contains('app-collapsed'));
      if (!isCollapsed) throw new Error('App not collapsed');
    }).toPass({ timeout: 20000 });
    
    // WebKit can be slow to show/enable the launcher card
    const launcher = page.locator('#launcherCard');
    await expect(launcher).toBeVisible({ timeout: 20000 });
    
    // Force click and dispatch event for robustness
    await expect(async () => {
      // Small delay to ensure transitions finished
      await page.waitForTimeout(2000);
      
      await launcher.click({ force: true }).catch(() => {});
      await launcher.dispatchEvent('mousedown');
      await launcher.dispatchEvent('mouseup');
      await launcher.dispatchEvent('click');
      const isCollapsed = await page.evaluate(() => document.body.classList.contains('app-collapsed'));
      if (isCollapsed) throw new Error('App still collapsed');
    }).toPass({ timeout: 30000 });
    
    // Check for expanded state
    await expect(page.locator('body')).not.toHaveClass(/app-collapsed/, { timeout: 20000 });
  });

  test('minimize button toggles minimized state', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const body = page.locator('body');
    const minimizeBtn = page.locator('#windowButtonMinimize');
    
    // Toggle minimized on
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await minimizeBtn.click({ force: true }).catch(() => {});
      await minimizeBtn.dispatchEvent('mousedown');
      await minimizeBtn.dispatchEvent('mouseup');
      await minimizeBtn.dispatchEvent('click');
      const isMinimized = await body.evaluate(el => el.classList.contains('app-minimized'));
      if (!isMinimized) throw new Error('App not minimized');
    }).toPass({ timeout: 30000 });
    
    // Toggle minimized off
    await expect(async () => {
      await page.waitForTimeout(2000);
      
      await minimizeBtn.click({ force: true }).catch(() => {});
      await minimizeBtn.dispatchEvent('mousedown');
      await minimizeBtn.dispatchEvent('mouseup');
      await minimizeBtn.dispatchEvent('click');
      const isMinimized = await body.evaluate(el => el.classList.contains('app-minimized'));
      if (isMinimized) throw new Error('App still minimized');
    }).toPass({ timeout: 30000 });
  });

  test('maximize button expands all experience cards', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const maximizeBtn = page.locator('#windowButtonMaximize');
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await maximizeBtn.click({ force: true }).catch(() => {});
      await maximizeBtn.dispatchEvent('mousedown');
      await maximizeBtn.dispatchEvent('mouseup');
      await maximizeBtn.dispatchEvent('click');
      
      const cards = page.locator('.experience-card');
      const count = await cards.count();
      if (count === 0) throw new Error('No experience cards found');
      
      for (let i = 0; i < count; i++) {
        const isOpen = await cards.nth(i).evaluate(el => el.classList.contains('open'));
        if (!isOpen) throw new Error(`Experience card ${i} not expanded`);
      }
    }).toPass({ timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// Experience Cards
// ---------------------------------------------------------------------------
test.describe('Experience Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
  });

  test('clicking a card toggle button expands it', async ({ page }) => {
    test.slow();
    // Test a non-first card because the first card starts expanded by default
    const targetCard = page.locator('.experience-card').nth(1);
    const toggle = targetCard.locator('.experience-toggle');
    
    // Ensure the card is ready and NOT yet expanded
    await expect(async () => {
      const isVisible = await targetCard.isVisible();
      if (!isVisible) throw new Error('Target card not visible');
      const isOpen = await targetCard.evaluate(el => el.classList.contains('open'));
      if (isOpen) throw new Error('Target card already open');
    }).toPass({ timeout: 20000 });
    
    // Use click first, fallback to dispatchEvent if needed (via toPass logic)
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await toggle.click({ force: true }).catch(() => {});
      await toggle.dispatchEvent('mousedown');
      await toggle.dispatchEvent('mouseup');
      await toggle.dispatchEvent('click');
      const isOpen = await targetCard.evaluate(el => el.classList.contains('open'));
      if (!isOpen) throw new Error('Card not expanded');
    }).toPass({ timeout: 20000 });
  });

  test('clicking an open card collapses it', async ({ page }) => {
    test.slow();
    // The first card starts expanded by default
    const firstCard = page.locator('.experience-card').first();
    const toggle = firstCard.locator('.experience-toggle');
    
    // Ensure the card is indeed open initially - use a longer window for initial load
    await expect(async () => {
      const isOpen = await firstCard.evaluate(el => el.classList.contains('open'));
      if (!isOpen) throw new Error('Initial card not open');
    }).toPass({ timeout: 30000 });
    
    // Use click first, fallback to dispatchEvent if needed
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await toggle.click({ force: true }).catch(() => {});
      await toggle.dispatchEvent('mousedown');
      await toggle.dispatchEvent('mouseup');
      await toggle.dispatchEvent('click');
      const isOpen = await firstCard.evaluate(el => el.classList.contains('open'));
      if (isOpen) throw new Error('Card still expanded');
    }).toPass({ timeout: 20000 });
  });

  test('experience cards contain bullet points', async ({ page }) => {
    test.slow();
    const firstCard = page.locator('.experience-card').first();
    const toggle = firstCard.locator('.experience-toggle');
    
    // Ensure the card is open
    await expect(async () => {
      const isOpen = await firstCard.evaluate(el => el.classList.contains('open'));
      if (!isOpen) {
        await toggle.click({ force: true }).catch(() => {});
        await toggle.dispatchEvent('click');
        const isOpenRetry = await firstCard.evaluate(el => el.classList.contains('open'));
        if (!isOpenRetry) throw new Error('Experience card not open for content check');
      }
    }).toPass({ timeout: 20000 });
    
    const bullets = firstCard.locator('ul li');
    await expect(bullets.first()).toBeVisible({ timeout: 15000 });
    const count = await bullets.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Print Layout
// ---------------------------------------------------------------------------
test.describe('Print Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
  });

  test('print resume root element is attached to DOM', async ({ page }) => {
    test.slow();
    await expect(page.locator('#printResumeRoot')).toBeAttached({ timeout: 15000 });
  });

  test('print name is populated', async ({ page }) => {
    test.slow();
    await expect(page.locator('#printName')).not.toBeEmpty({ timeout: 15000 });
  });

  test('print contact line is populated', async ({ page }) => {
    test.slow();
    await expect(page.locator('#printContactLine')).not.toBeEmpty({ timeout: 15000 });
  });

  test('print summary is populated', async ({ page }) => {
    test.slow();
    await expect(page.locator('#printSummary')).not.toBeEmpty({ timeout: 15000 });
  });

  test('print skills section is populated', async ({ page }) => {
    test.slow();
    await expect(page.locator('#printSkills')).not.toBeEmpty({ timeout: 15000 });
  });

  test('print experience list has entries', async ({ page }) => {
    test.slow();
    const items = page.locator('#printExperienceList .print-item');
    await expect(async () => {
      const count = await items.count();
      if (count === 0) throw new Error('No print items found');
    }).toPass({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------
test.describe('Keyboard Shortcuts', () => {
  test('pressing E expands all experience cards', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await page.keyboard.press('e');
      const cards = page.locator('.experience-card');
      const count = await cards.count();
      if (count === 0) throw new Error('No experience cards found');
      
      for (let i = 0; i < count; i++) {
        const isOpen = await cards.nth(i).evaluate(el => el.classList.contains('open'));
        if (!isOpen) throw new Error(`Experience card ${i} not expanded via E`);
      }
    }).toPass({ timeout: 30000 });
  });

  test('pressing M minimizes the app', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const body = page.locator('body');
    await expect(async () => {
      // Small delay to ensure page is interactive
      await page.waitForTimeout(2000);
      
      await page.keyboard.press('m');
      const isMinimized = await body.evaluate(el => el.classList.contains('app-minimized'));
      if (!isMinimized) throw new Error('App not minimized via M');
    }).toPass({ timeout: 30000 });
  });
});
