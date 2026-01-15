
import { test, expect } from '@playwright/test';

test.describe('File Explorer Page', () => {
  test('should display the settings button in the action bar', async ({ page }) => {
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

    // Navigate to the file explorer page
    await page.goto('http://localhost:5173/explorer');

    // Wait for the page to load and the action bar to be visible
    await page.waitForSelector('[data-testid="bottom-action-bar"]');

    // Take a screenshot to verify the UI
    await page.screenshot({ path: 'verification/screenshot.png' });

    // Check if the settings button is visible
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
  });
});
