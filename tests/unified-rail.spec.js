import { test, expect } from '@playwright/test';

test.describe('Unified Liquid Rail', () => {
  test.use({ viewport: { width: 375, height: 667 }, userAgent: 'iPhone 12' });

  test.beforeEach(async ({ page }) => {
    // Mock API calls to prevent redirects and allow the editor to load
    await page.route('/api/me', route => route.fulfill({ status: 200, json: { username: 'test-user' } }));
    await page.route('/api/repos', route => route.fulfill({ status: 200, json: [{ name: 'test-repo', owner: 'test-owner' }] }));
    await page.route('/api/files?repo=test-repo', route => route.fulfill({ status: 200, json: [] }));

    // Navigate to a page with the editor
    await page.goto('/editor/new-page');

    // Wait for the editor to be ready by looking for the content editable area
    await page.waitForSelector('.editor-input [contenteditable="true"]');
  });

  test('should open in style mode on text selection', async ({ page }) => {
    const editor = page.locator('.editor-input [contenteditable="true"]');
    const rail = page.locator('.unified-liquid-rail');
    const styleButton = rail.locator('button[title="Bold"]');

    // Initially, the rail should not be visible
    await expect(rail).not.toBeVisible();

    // Add some text and select it
    await editor.fill('Hello World');
    await editor.selectText();

    // The rail should become visible and be in style mode
    await expect(rail).toBeVisible();
    await expect(styleButton).toBeVisible();

    // The "Add" mode buttons should not be visible
    const addButton = rail.locator('button[title="Image"]');
    await expect(addButton).not.toBeVisible();
  });

  test('should open in add mode on hamburger single tap', async ({ page }) => {
    const hamburger = page.locator('.rail-hamburger');
    const rail = page.locator('.unified-liquid-rail');
    const addButton = rail.locator('button[title="Image"]');

    // Initially, only the hamburger should be part of the rail logic, but the rail itself is not "open"
    await expect(hamburger).toBeVisible();
    await expect(rail).toHaveClass(/closed/);

    // Single tap the hamburger
    await hamburger.click();

    // The rail should open in add mode
    await expect(rail).toBeVisible();
    await expect(rail).toHaveClass(/open/);
    await expect(addButton).toBeVisible();

    // Style buttons should not be visible
    const styleButton = rail.locator('button[title="Bold"]');
    await expect(styleButton).not.toBeVisible();
  });

  test('should expand to show labels on hamburger double tap', async ({ page }) => {
    const hamburger = page.locator('.rail-hamburger');
    const rail = page.locator('.unified-liquid-rail');

    await expect(rail).not.toHaveClass(/expanded/);

    // Double tap the hamburger
    await hamburger.dblclick();

    // The rail should be expanded
    await expect(rail).toBeVisible();
    await expect(rail).toHaveClass(/expanded/);

    // Check for a label's visibility
    const label = rail.locator('span.rail-item-label', { hasText: 'Image' });
    await expect(label).toBeVisible();
  });

  test('should apply style without losing selection', async ({ page }) => {
    const editor = page.locator('.editor-input [contenteditable="true"]');
    const rail = page.locator('.unified-liquid-rail');
    const boldButton = rail.locator('button[title="Bold"]');

    // Add text and select it to show the style rail
    await editor.fill('Test Bold');
    await editor.selectText();
    await expect(rail).toBeVisible();

    // Click the bold button
    await boldButton.click();

    // Check that the text is now bold
    await expect(editor.locator('strong')).toHaveText('Test Bold');

    // Check that the selection is still active by trying to apply another style
    const italicButton = rail.locator('button[title="Italic"]');
    await italicButton.click();
    await expect(editor.locator('strong > em')).toHaveText('Test Bold');
  });
});
