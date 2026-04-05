import { test, expect } from '@playwright/test';

test.describe('Profile Photo Hover Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Give some time for initial render
    await page.waitForLoadState('networkidle');
  });

  test('Profile photo should NOT have coin-spin or photo-flipped classes by default', async ({ page }) => {
    const photoFrame = page.locator('.profile-photo-frame');
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    await expect(photoFrame).not.toHaveClass(/photo-flipped/);
  });

  test('Profile photo should NOT flip automatically over time', async ({ page }) => {
    const photoFrame = page.locator('.profile-photo-frame');
    
    // Wait for a few seconds (previous logic was 3-5s flip delay)
    await page.waitForTimeout(6000);
    
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    await expect(photoFrame).not.toHaveClass(/photo-flipped/);
  });

  test('Profile photo should flip on hover', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    const photoFrame = page.locator('.profile-photo-frame');
    
    // Hover over the photo frame
    await photoFrame.hover({ force: true });
    
    // Check if classes are added (coin-spin is transient but photo-flipped is added immediately)
    // coin-spin lasts for 980ms in the code
    await expect(photoFrame).toHaveClass(/coin-spin/);
    await expect(photoFrame).toHaveClass(/photo-flipped/);
    
    // Wait for the flip back to happen (980ms timeout)
    await page.waitForTimeout(1500);
    
    // Classes should be removed
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    await expect(photoFrame).not.toHaveClass(/photo-flipped/);
  });

  test('Profile photo should flip on second hover after cooldown', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    const photoFrame = page.locator('.profile-photo-frame');
    
    // First flip
    await photoFrame.hover();
    await page.waitForTimeout(1500);
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    
    // Second flip (need to move mouse away and back)
    await page.mouse.move(0, 0); 
    await page.waitForTimeout(500);
    // WebKit can be extremely slow with CSS animations and hover events on CI
    await expect(async () => {
      await photoFrame.hover({ force: true });
      await expect(photoFrame).toHaveClass(/coin-spin/);
      await expect(photoFrame).toHaveClass(/photo-flipped/);
    }).toPass({ timeout: 10000 });
  });
});
