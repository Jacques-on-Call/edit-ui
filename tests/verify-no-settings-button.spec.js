
import { test, expect } from '@playwright/test';

test.describe('Content Editor Page', () => {
  test('should not display the settings button in the action bar', async ({ page }) => {
    // Start the server and navigate to the page
    await page.goto('http://localhost:5173');

    // Mock localStorage to simulate an authenticated user
    await page.evaluate(() => {
      localStorage.setItem('github_token', 'mock_token');
      localStorage.setItem('selectedRepo', 'mock_repo/mock_name');
    });

    // Mock API calls
    await page.route('/api/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ login: 'test-user' }),
      });
    });
    await page.route('/api/repos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ full_name: 'mock_repo/mock_name' }]),
      });
    });

    // Navigate to the content editor page
    await page.goto('http://localhost:5173/editor/mock_page');

    // Wait for the page to load and the action bar to be visible
    await page.waitForSelector('[data-testid="editor-action-bar"]');

    // Take a screenshot to verify the UI
    await page.screenshot({ path: 'verification/no-settings-button.png' });

    // Check that the settings button is not visible
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await expect(settingsButton).not.toBeVisible();
  });
});
