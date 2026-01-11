import { test, expect } from '@playwright/test';

test.describe('Unified Liquid Rail Verification', () => {

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

  // Test Case 1: Rail appears on text selection (Desktop)
  test('should show compact rail on text selection on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const editor = page.locator('.editor-input');
    await editor.dblclick();

    const rail = page.locator('.unified-liquid-rail');
    await expect(rail).toBeVisible();
    await expect(rail).toHaveClass(/open/);
    await expect(rail).not.toHaveClass(/expanded/);
  });

  // Test Case 2: Rail expands on hamburger click (Desktop)
  test('should expand rail on hamburger click on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const hamburger = page.locator('.rail-hamburger');
    await hamburger.click();

    const rail = page.locator('.unified-liquid-rail');
    await expect(rail).toBeVisible();
    await expect(rail).toHaveClass(/open/);

    await hamburger.click();
    await expect(rail).toHaveClass(/expanded/);
  });

  // Test Case 3: Style buttons are active when formatting is applied
  test('should show active state for style buttons', async ({ page }) => {
    const editor = page.locator('.editor-input');
    await editor.focus();
    await editor.press('Control+A'); // Select all text

    // Ensure the rail is visible before interacting with its buttons
    const rail = page.locator('.unified-liquid-rail');
    await expect(rail).toBeVisible();

    // Apply bold formatting
    const boldButton = page.locator('.rail-item[title="Bold"]');
    await boldButton.click();

    // Add a small delay to allow for the component to re-render
    await page.waitForTimeout(500);

    // Check if the bold button has the 'active' class
    await expect(boldButton).toHaveClass(/active/);
  });

  // Test Case 4: Verify aesthetic properties (translucency)
  test('should have liquid glass effect', async ({ page }) => {
    const hamburger = page.locator('.rail-hamburger');
    await hamburger.click();

    const rail = page.locator('.unified-liquid-rail');
    await expect(rail).toHaveCSS('background-color', 'rgba(25, 35, 45, 0.4)');
    const backdropFilter = await rail.evaluate(el => window.getComputedStyle(el).backdropFilter);
    expect(backdropFilter).toContain('blur');
  });

});
