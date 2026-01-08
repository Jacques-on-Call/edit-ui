import { test, expect } from '@playwright/test';
import { devices } from '@playwright/test';

// Sample data for mocking the initial state of the editor's content.
const MOCK_SECTIONS_CONTENT = {
  sections: [
    { id: '1', type: 'hero', props: { title: 'Initial Hero Title' } },
    { id: '2', type: 'textSection', props: { body: '<p>Initial text content.</p>' } }
  ]
};

// Sample HTML that we pretend the editor generates after an edit.
// This will be served to the preview iframe.
const MOCK_UPDATED_HTML_OUTPUT = '<html><body><h1>Updated Preview Title</h1><p>This is the updated content.</p></body></html>';

test.describe('Phase 3: On-Demand Preview System Verification', () => {

  // Run the same test suite for both desktop and mobile viewports.
  for (const deviceName of ['Desktop Chrome', 'Pixel 5']) {

    test(`should allow editing, previewing, and returning to editor on ${deviceName}`, async ({ page }) => {
      // Set the viewport to the current device being tested.
      await page.setViewportSize(devices[deviceName].viewport);

      // --- MOCK API CALLS to isolate the frontend ---

      // 1. Mock the user authentication check.
      await page.route('/api/me', route => route.fulfill({ status: 200, json: { login: 'test-user' } }));

      // 2. Mock the file content that loads into the editor.
      await page.route('/api/get-file-content**', route => route.fulfill({
          status: 200,
          json: {
              content: Buffer.from(JSON.stringify(MOCK_SECTIONS_CONTENT)).toString('base64')
          }
      }));

      // 3. Mock the API endpoint that stores the preview HTML.
      // We check that it's called, and we respond with a success message and a fake URL for the preview.
      await page.route('/api/store-preview', async route => {
          await route.fulfill({
              status: 200,
              json: { success: true, previewUrl: '/preview/test-page-123' }
          });
      });

      // 4. Mock the actual preview page that the iframe will load.
      // We serve back the predefined "updated" HTML to simulate the preview rendering.
      await page.route('/preview/test-page-123**', route => {
          route.fulfill({
              status: 200,
              contentType: 'text/html',
              body: MOCK_UPDATED_HTML_OUTPUT
          });
      });

      // --- TEST EXECUTION ---

      // Navigate to the editor for a JSON file, which enables the sections editor mode.
      await page.goto('/editor/content/pages/test-preview-page.json');

      // Wait for an element from the initial editor content to be visible.
      await expect(page.locator('text=Initial Hero Title')).toBeVisible({ timeout: 10000 });

      // Find the "Preview" button in the action bar.
      const previewButton = page.locator('button[aria-label="Preview"]');
      await expect(previewButton).toBeVisible();

      // Click the "Preview" button to trigger the new functionality.
      await previewButton.click();

      // Verify that the loading indicator appears while the preview is being generated.
      // A soft assertion is used as this state can be very brief.
      await expect.soft(page.locator('button[aria-label="Generating Preview..."]')).toBeVisible();

      // Find the iframe and verify that it now contains the "updated" HTML.
      const iframe = page.frameLocator('iframe[title="Live Preview"]');
      await expect(iframe.locator('body')).toContainText('Updated Preview Title', { timeout: 15000 });
      await expect(iframe.locator('body')).toContainText('This is the updated content.');

      // The same button should now function as the "Edit" button.
      const editButton = page.locator('button[aria-label="Edit"]');
      await expect(editButton).toBeVisible();

      // Click the "Edit" button to return to the editor view.
      await editButton.click();

      // Verify that an element from the original editor content is visible again,
      // and that the preview iframe is no longer on the page.
      await expect(page.locator('text=Initial Hero Title')).toBeVisible();
      await expect(page.frameLocator('iframe[title="Live Preview"]')).not.toBeVisible();
    });
  }
});
