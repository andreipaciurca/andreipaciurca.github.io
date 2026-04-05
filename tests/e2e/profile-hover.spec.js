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
    
    // Attempt to trigger hover via mouse and events
    await expect(async () => {
      // 1. Dispatch event directly (most reliable for class toggling)
      await photoFrame.dispatchEvent('mouseenter');
      
      // 2. Move mouse as fallback
      const box = await photoFrame.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      }
      
      const hasFlippedClass = await photoFrame.evaluate(el => el.classList.contains('photo-flipped'));
      if (!hasFlippedClass) throw new Error('Flip class not added');
    }).toPass({ timeout: 20000 });
    
    // Verify classes are present
    await expect(photoFrame).toHaveClass(/coin-spin/);
    await expect(photoFrame).toHaveClass(/photo-flipped/);
    
    // Wait for auto-reset
    await page.waitForTimeout(2000);
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
      if (!hasSpin) {
        await photoFrame.dispatchEvent('mouseenter');
        const hasSpinRetry = await photoFrame.evaluate(el => el.classList.contains('coin-spin'));
        if (!hasSpinRetry) throw new Error('First hover flip not triggered');
      }
    }).toPass({ timeout: 10000 });
    
    await page.waitForTimeout(2000);
    await expect(photoFrame).not.toHaveClass(/coin-spin/);
    
    // Move mouse away
    await page.mouse.move(0, 0); 
    await photoFrame.dispatchEvent('mouseleave');
    await page.waitForTimeout(1000);

    // Second flip
    await expect(async () => {
      await photoFrame.dispatchEvent('mouseenter');
      const box = await photoFrame.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      }
      const hasSpin = await photoFrame.evaluate(el => el.classList.contains('coin-spin'));
      if (!hasSpin) throw new Error('Second hover flip not triggered');
    }).toPass({ timeout: 20000 });
    
    await expect(photoFrame).toHaveClass(/coin-spin/);
    await expect(photoFrame).toHaveClass(/photo-flipped/);
  });
});
