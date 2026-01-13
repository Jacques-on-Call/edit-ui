import { test, expect } from '@playwright/test';

const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

const MOCK_API_CALLS = async (page) => {
  await page.route('/api/me', route => route.fulfill({ status: 200, json: { login: 'test-user' } }));
  await page.route('/api/repos', route => route.fulfill({ status: 200, json: [{ full_name: 'test/repo' }] }));

  // Mock file content with a valid base64 encoded JSON string
  const mockSections = { sections: [{ id: '1', type: 'hero', props: { title: 'Hello World' } }] };
  const mockContent = Buffer.from(JSON.stringify(mockSections)).toString('base64');

  await page.route('**/api/get-file-content**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: { content: mockContent }
  }));
};

test.describe('Editor Header Padding Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    await MOCK_API_CALLS(page);
  });

  test('should not have top padding on editor page (Desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/editor/test-page');

    const mainContent = page.locator('main.pb-\\[var\\(--action-bar-height\\)\\]');
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    // Directly check the computed style for padding-top.
    const paddingTop = await mainContent.evaluate(el => window.getComputedStyle(el).paddingTop);

    // The padding should be 0px, confirming the fix.
    expect(paddingTop).toBe('0px');

    await page.screenshot({ path: 'verification/desktop-editor-no-padding.png', fullPage: true });
    console.log('Desktop verification screenshot saved to verification/desktop-editor-no-padding.png');
  });

  test('should not have top padding on editor page (Mobile)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/editor/test-page');

    const mainContent = page.locator('main.pb-\\[var\\(--action-bar-height\\)\\]');
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    const paddingTop = await mainContent.evaluate(el => window.getComputedStyle(el).paddingTop);

    expect(paddingTop).toBe('0px');

    await page.screenshot({ path: 'verification/mobile-editor-no-padding.png', fullPage: true });
    console.log('Mobile verification screenshot saved to verification/mobile-editor-no-padding.png');
  });

});
