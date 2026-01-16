
import { test, expect } from '@playwright/test';

test.describe('Settings Page - Integrations Tab', () => {
  test('should display the Integrations tab with correct fields', async ({ page }) => {
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

    // Navigate to the settings page
    await page.goto('http://localhost:5173/settings');

    // Click on the Integrations tab
    await page.getByRole('button', { name: 'Integrations & Secrets' }).click();

    // Check that the heading is visible
    await expect(page.getByRole('heading', { name: 'Integrations & Secrets' })).toBeVisible();

    // Check for the Cloudflare Account ID field
    const cfAccountId = page.locator('#cfAccountId');
    await expect(cfAccountId).toBeVisible();
    await expect(cfAccountId).toHaveAttribute('type', 'password');

    // Check for the Cloudflare API Token field
    const cfApiToken = page.locator('#cfApiToken');
    await expect(cfApiToken).toBeVisible();
    await expect(cfApiToken).toHaveAttribute('type', 'password');

    // Check for the Test Connection button
    await expect(page.getByRole('button', { name: 'Test' })).toBeVisible();

    // Check for the Resend API Key field
    const resendApiKey = page.locator('#resendApiKey');
    await expect(resendApiKey).toBeVisible();
    await expect(resendApiKey).toHaveAttribute('type', 'password');

    // Check for the Save Secrets button
    await expect(page.getByRole('button', { name: 'Save Secrets' })).toBeVisible();

    // Take a screenshot to verify the UI
    await page.screenshot({ path: 'verification/integrations-tab.png' });

    // --- Test Interactivity ---

    // Mock the /api/secrets endpoint and capture the request
    let saveRequest = null;
    await page.route('/api/secrets', async (route) => {
      const request = route.request();
      const json = await request.postDataJSON();
      if (json.action === 'save') {
        saveRequest = json;
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success!' }),
      });
    });

    // Fill out the form
    await page.locator('#cfAccountId').fill('test-account-id');
    await page.locator('#cfApiToken').fill('test-api-token');
    await page.locator('#resendApiKey').fill('test-resend-key');

    // Click the Test Connection button and verify the status message
    await page.getByRole('button', { name: 'Test' }).click();
    await expect(page.locator('text=Success!')).toBeVisible();

    // Click the Save Secrets button and verify the status message
    await page.getByRole('button', { name: 'Save Secrets' }).click();
    await expect(page.locator('text=Success!')).toBeVisible();

    // Assert that the cfApiToken was sent in the save request
    expect(saveRequest).not.toBeNull();
    expect(saveRequest.cfApiToken).toBe('test-api-token');
  });
});
