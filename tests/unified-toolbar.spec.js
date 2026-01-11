import { test, expect } from '@playwright/test';

test.describe('Unified Liquid Rail Toolbar Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Set a dummy value for the selected repository in localStorage.
    // The application uses this to decide if it can proceed to the editor.
    await page.addInitScript(() => {
      window.localStorage.setItem('selectedRepo', '{"name":"test-repo","owner":"test-owner"}');
    });

    // Mock necessary API calls
    await page.route('/api/me', route => route.fulfill({ status: 200, json: { username: 'test-user', isAuthenticated: true } }));
    await page.route('/api/repos', route => route.fulfill({ status: 200, json: [{ name: 'test-repo', owner: 'test-owner' }] }));
    await page.route('**/api/files**', route => route.fulfill({ status: 200, json: [] }));
    await page.route('**/api/get-file-content**', route => route.fulfill({ status: 200, json: { content: 'This is some test content for the editor.' } }));

    // Go directly to a test editor page.
    await page.goto('http://localhost:5173/editor/test-page');

    // Wait for the editor to be visible and ready for interaction.
    await expect(page.locator('.editor-input')).toBeVisible({ timeout: 15000 });
  });

  // Test Case 1: Toolbar appears on text selection (Desktop)
  test('should show toolbar on text selection on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Find the editor and simulate a double click to select text
    const editor = page.locator('.editor-input');
    await editor.dblclick();

    // The toolbar should now be visible
    const toolbar = page.locator('.slideout-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveClass(/collapsed/); // Should be in icon-only mode
  });

  // Test Case 2: Toolbar appears on hamburger click (Desktop)
  test('should show toolbar on hamburger click on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Find the hamburger trigger and click it
    const hamburger = page.locator('.floating-hamburger');
    await hamburger.click();

    // The toolbar should now be visible
    const toolbar = page.locator('.slideout-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveClass(/collapsed/);

    // Second click should expand it
    await hamburger.click();
    const expandedToolbar = page.locator('.slideout-toolbar');
    await expect(expandedToolbar).toHaveClass(/expanded/);
  });

  // Test Case 3: Toolbar appears on text selection (Mobile)
  test('should show toolbar on text selection on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Find the editor and simulate a double click to select text
    const editor = page.locator('.editor-input');
    await editor.dblclick();

    // The toolbar should now be visible
    const toolbar = page.locator('.slideout-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveClass(/collapsed/);
  });

  // Test Case 4: Toolbar appears on hamburger click (Mobile)
  test('should show toolbar on hamburger click on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Find the hamburger trigger and click it
    const hamburger = page.locator('.floating-hamburger');
    await hamburger.click();

    // The toolbar should now be visible
    const toolbar = page.locator('.slideout-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveClass(/collapsed/);
  });
});
