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
    // In WebKit/headless, hover can be tricky. Use a retry logic and wait for transform.
    await expect(async () => {
      await photoFrame.hover({ force: true });
      const transform = await photoFrame.evaluate(el => window.getComputedStyle(el).getPropertyValue('transform'));
      if (transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)') {
        throw new Error('Hover flip not triggered');
      }
    }).toPass({ timeout: 15000 });
    
    // Check if classes are added
    await expect(photoFrame).toHaveClass(/coin-spin/);
    await expect(photoFrame).toHaveClass(/photo-flipped/);
    
    // Wait for the flip back to happen (980ms in production)
    await page.waitForTimeout(2000);
    
    // Classes should be removed
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    await expect(photoFrame).not.toHaveClass(/photo-flipped/);
  });

  test('Profile photo should flip on second hover after cooldown', async ({ page }) => {
    // Increase timeout for WebKit flakiness
    test.slow();
    const photoFrame = page.locator('.profile-photo-frame');
    
    // First flip
    await expect(async () => {
      await photoFrame.hover({ force: true });
      const hasSpin = await photoFrame.evaluate(el => el.classList.contains('coin-spin'));
      if (!hasSpin) throw new Error('First hover flip not triggered');
    }).toPass({ timeout: 10000 });
    
    await page.waitForTimeout(2000);
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    
    // Move mouse away
    await page.mouse.move(0, 0); 
    await page.waitForTimeout(500);

    // Second flip
    await expect(async () => {
      await page.mouse.move(0, 0); 
      await page.waitForTimeout(200);
      await photoFrame.hover({ force: true });
      const hasSpin = await photoFrame.evaluate(el => el.classList.contains('coin-spin'));
      if (!hasSpin) throw new Error('Second hover flip not triggered');
    }).toPass({ timeout: 15000 });
    
    await expect(photoFrame).toHaveClass(/coin-spin/);
    await expect(photoFrame).toHaveClass(/photo-flipped/);
  });
});
