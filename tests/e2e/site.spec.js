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
  await page.waitForLoadState('networkidle');
  // candidateName is set synchronously in renderPage() — if it has content the
  // module graph loaded and executed without error.
  await expect(page.locator('#candidateName')).not.toBeEmpty({ timeout: 8000 });
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
    await expect(page).toHaveTitle(/Andrei/);
  });

  test('candidate name is rendered', async ({ page }) => {
    await expect(page.locator('#candidateName')).not.toBeEmpty();
  });

  test('hero role is rendered', async ({ page }) => {
    await expect(page.locator('#heroRole')).not.toBeEmpty();
  });

  test('status line is rendered', async ({ page }) => {
    await expect(page.locator('#statusLine')).not.toBeEmpty();
  });

  test('hero summary types out text', async ({ page }) => {
    // typeTextInDuration runs over ~2.5 s — wait generously
    await expect(page.locator('#heroSummary')).not.toBeEmpty({ timeout: 10000 });
  });

  test('correct number of experience cards rendered', async ({ page }) => {
    const cards = page.locator('.experience-card');
    await expect(cards).toHaveCount(4);
  });

  test('skill chips are populated', async ({ page }) => {
    const chips = page.locator('.skill-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('contact links are present and not empty', async ({ page }) => {
    await expect(page.locator('#emailValue')).not.toBeEmpty();
    await expect(page.locator('#linkedinValue')).not.toBeEmpty();
    await expect(page.locator('#githubValue')).not.toBeEmpty();
  });

  test('footer shows candidate name and current year', async ({ page }) => {
    const year = String(new Date().getFullYear());
    await expect(page.locator('#footerName')).not.toBeEmpty();
    await expect(page.locator('#currentYear')).toHaveText(year);
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
    await expect(page.locator('#printResumeButton')).toBeVisible();
  });

  test('two pointer hands flank the button', async ({ page }) => {
    await expect(page.locator('.resume-pointer')).toHaveCount(2);
  });

  test('pointer hands contain the expected Font Awesome icons', async ({ page }) => {
    await expect(page.locator('.fa-hand-point-right')).toBeVisible();
    await expect(page.locator('.fa-hand-point-left')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Theme Toggle
// ---------------------------------------------------------------------------
test.describe('Theme Toggle', () => {
  test('starts in dark mode', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await expect(page.locator('body')).not.toHaveClass(/light-mode/);
  });

  test('clicking theme toggle switches to light mode', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const body = page.locator('body');
    const toggle = page.locator('#themeToggleButton');
    
    await toggle.click({ force: true });
    
    // WebKit/CI can be extremely slow with CSS transitions/state changes
    await expect(async () => {
      // Use a custom predicate for more reliability in slow environments
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (!hasClass) throw new Error('light-mode class not found');
    }).toPass({ timeout: 15000 });
  });

  test('clicking theme toggle twice returns to dark mode', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    const body = page.locator('body');
    const toggle = page.locator('#themeToggleButton');
    
    await toggle.click({ force: true });
    await expect(async () => {
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (!hasClass) throw new Error('light-mode class not found after first click');
    }).toPass({ timeout: 15000 });
    
    await toggle.click({ force: true });
    await expect(async () => {
      const hasClass = await body.evaluate(el => el.classList.contains('light-mode'));
      if (hasClass) throw new Error('light-mode class still present after second click');
    }).toPass({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// App Window Controls
// ---------------------------------------------------------------------------
test.describe('App Window Controls', () => {
  test('close button collapses app to launcher', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await page.locator('#windowButtonClose').click();
    await expect(page.locator('body')).toHaveClass(/app-collapsed/);
  });

  test('clicking launcher card reopens the app', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await page.locator('#windowButtonClose').click();
    await page.locator('#launcherCard').click();
    await expect(page.locator('body')).not.toHaveClass(/app-collapsed/);
  });

  test('minimize button toggles minimized state', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await waitForBootstrap(page);
    
    const body = page.locator('body');
    const minimizeBtn = page.locator('#windowButtonMinimize');
    
    await minimizeBtn.click({ force: true });
    await expect(async () => {
      const isMinimized = await body.evaluate(el => el.classList.contains('app-minimized'));
      if (!isMinimized) throw new Error('app-minimized class not found');
    }).toPass({ timeout: 15000 });

    await minimizeBtn.click({ force: true });
    await expect(async () => {
      const isMinimized = await body.evaluate(el => el.classList.contains('app-minimized'));
      if (isMinimized) throw new Error('app-minimized class still present');
    }).toPass({ timeout: 15000 });
  });

  test('maximize button expands all experience cards', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await page.locator('#windowButtonMaximize').click();
    const cards = page.locator('.experience-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveClass(/open/);
    }
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
    const firstCard = page.locator('.experience-card').first();
    const toggle = firstCard.locator('.experience-toggle');
    
    // Ensure the card is ready and clickable
    await expect(toggle).toBeVisible();
    
    // Use evaluate for click to be most direct in slow environments
    await toggle.click({ force: true });
    
    // Use robust check for state
    await page.waitForFunction((el) => {
      return el.classList.contains('open');
    }, await firstCard.elementHandle(), { timeout: 15000 });
  });

  test('clicking an open card collapses it', async ({ page }) => {
    test.slow();
    const firstCard = page.locator('.experience-card').first();
    const toggle = firstCard.locator('.experience-toggle');
    
    // Open the card first
    await expect(toggle).toBeVisible();
    await toggle.click({ force: true });
    
    // Wait for the open class using a custom predicate for better reliability
    await page.waitForFunction((el) => {
      return el.classList.contains('open');
    }, await firstCard.elementHandle(), { timeout: 15000 });
    
    // Close the card
    await toggle.click({ force: true });
    
    // Wait for the open class to be removed
    await page.waitForFunction((el) => {
      return !el.classList.contains('open');
    }, await firstCard.elementHandle(), { timeout: 15000 });
  });

  test('experience cards contain bullet points', async ({ page }) => {
    test.slow();
    const firstCard = page.locator('.experience-card').first();
    await firstCard.locator('.experience-toggle').click();
    const bullets = firstCard.locator('ul li');
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
    await expect(page.locator('#printResumeRoot')).toBeAttached();
  });

  test('print name is populated', async ({ page }) => {
    await expect(page.locator('#printName')).not.toBeEmpty();
  });

  test('print contact line is populated', async ({ page }) => {
    await expect(page.locator('#printContactLine')).not.toBeEmpty();
  });

  test('print summary is populated', async ({ page }) => {
    await expect(page.locator('#printSummary')).not.toBeEmpty();
  });

  test('print skills section is populated', async ({ page }) => {
    await expect(page.locator('#printSkills')).not.toBeEmpty();
  });

  test('print experience list has entries', async ({ page }) => {
    const items = page.locator('#printExperienceList .print-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------
test.describe('Keyboard Shortcuts', () => {
  test('pressing E expands all experience cards', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await page.keyboard.press('e');
    
    // Give some time for the state to settle in slow browsers
    await expect(async () => {
      const cards = page.locator('.experience-card');
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        const isOpen = await cards.nth(i).evaluate(el => el.classList.contains('open'));
        if (!isOpen) throw new Error(`Card ${i} not expanded`);
      }
    }).toPass({ timeout: 10000 });
  });

  test('pressing M minimizes the app', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await page.keyboard.press('m');
    
    await expect(async () => {
      const isMinimized = await page.locator('body').evaluate(el => el.classList.contains('app-minimized'));
      if (!isMinimized) throw new Error('App not minimized after pressing M');
    }).toPass({ timeout: 10000 });
  });
});
