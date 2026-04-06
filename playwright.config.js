/**
 * Playwright E2E configuration.
 *
 * Prerequisites (run once):
 *   npx playwright install
 *
 * Run E2E tests:
 *   npm run test:e2e
 *
 * Run all tests (unit + e2e):
 *   npm run test:all
 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',

  // Spin up the built-in Python HTTP server before running tests.
  // Change the port if 8787 is already in use.
  webServer: {
    command: 'python3 -m http.server 8787',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },

  use: {
    baseURL: 'http://localhost:8787',
    // Capture trace on first retry to help debug flaky tests in CI
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
