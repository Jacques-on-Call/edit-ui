import { test, expect } from '@playwright/test';

test.describe('Image Uploader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor/src%2Fpages%2F_Test-4-loss.astro');
  });

  test('should open the image insert modal from the liquid rail', async ({ page }) => {
    // Click the "add" button in the liquid rail
    await page.locator('.rail-trigger-group button').nth(1).click();

    // Click the image button
    await page.locator('button.rail-item').locator('text=Image').click();

    // Check that the modal is visible
    await expect(page.locator('text=Insert Image')).toBeVisible();
  });
});
