import { test, expect } from '@playwright/test';

test.describe('AuthDebugMonitor', () => {
  test('should be present in the DOM in production mode', async ({ page }) => {
    // Navigate to the root of the app
    await page.goto('/');

    // The AuthDebugMonitor, when minimized, should render a button
    // with the title "Open Debug Monitor".
    const monitorButton = page.getByTitle('Open Debug Monitor');

    // Assert that the button is visible.
    // This confirms that the component is rendering outside of DEV mode.
    await expect(monitorButton).toBeVisible();
  });
});
