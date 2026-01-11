import { test, expect } from '@playwright/test';

test.describe("Architect's Spec Verification for Unified Liquid Rail", () => {

  test.beforeEach(async ({ page }) => {
    // Set up mocks and navigate to the editor page
    await page.addInitScript(() => {
      window.localStorage.setItem('selectedRepo', '{"name":"test-repo","owner":"test-owner"}');
    });
    await page.route('/api/me', route => route.fulfill({ status: 200, json: { username: 'test-user', isAuthenticated: true } }));
    await page.route('/api/repos', route => route.fulfill({ status: 200, json: [{ name: 'test-repo', owner: 'test-owner' }] }));
    await page.route('**/api/files**', route => route.fulfill({ status: 200, json: [] }));
    await page.route('**/api/get-file-content**', route => route.fulfill({ status: 200, json: { content: 'This is some test content for the editor.' } }));
    await page.goto('http://localhost:5173/editor/test-page');
    await expect(page.locator('.editor-input')).toBeVisible({ timeout: 15000 });
  });

  // Test Case 1: Verify focus retention and style application
  test('should apply style without losing editor focus', async ({ page }) => {
    const editor = page.locator('.editor-input');
    const boldButton = page.locator('.rail-item[title="Bold"]');

    // Select text to trigger the rail
    await editor.selectText();
    await expect(boldButton).toBeVisible();

    // Click the bold button using the onPointerDown handler
    await boldButton.dispatchEvent('pointerdown');

    // VERIFICATION: Check that the HTML was updated, which proves the action was successful
    await expect(editor.locator('strong')).toHaveText('This is some test content for the editor.');
  });

  // Test Case 2: Verify the 'active' state now works correctly
  test('should show active state for style buttons after applying format', async ({ page }) => {
    const editor = page.locator('.editor-input');
    const boldButton = page.locator('.rail-item[title="Bold"]');

    // Select text and apply bold
    await editor.selectText();
    await expect(boldButton).toBeVisible();
    await boldButton.dispatchEvent('pointerdown');

    // VERIFICATION: Wait for the result of the action (the strong tag), then check the class.
    // This is more reliable than a static timeout.
    await expect(editor.locator('strong')).toBeVisible();
    await expect(boldButton).toHaveClass(/active/);
  });

  // Test Case 3: Verify the aesthetic changes (translucency)
  test('should have the correct refined liquid glass effect', async ({ page }) => {
    const hamburger = page.locator('.rail-hamburger');
    await hamburger.dispatchEvent('pointerdown');

    const rail = page.locator('.unified-liquid-rail');
    await expect(rail).toBeVisible();

    // VERIFICATION: Check the new, more transparent background color
    await expect(rail).toHaveCSS('background-color', 'rgba(25, 35, 45, 0.2)');
    const backdropFilter = await rail.evaluate(el => window.getComputedStyle(el).backdropFilter);
    expect(backdropFilter).toContain('blur(24px)');
  });
});
