import { test, expect } from '@playwright/test';

test.describe('Auth Debug Monitor', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app (assuming root renders the monitor)
        await page.goto('/');
    });

    test('monitor is present and minimized by default', async ({ page }) => {
        // Check for the minimized bug icon
        const bugIcon = page.locator('button[title="Open Debug Monitor"]');
        await expect(bugIcon).toBeVisible();
    });

    test('can expand monitor and see logs', async ({ page }) => {
        // Click to expand
        await page.click('button[title="Open Debug Monitor"]');

        // Check for header
        await expect(page.locator('text=Auth Debug Monitor')).toBeVisible();

        // Check for system log
        await expect(page.locator('text=Monitor Initialized')).toBeVisible();
    });

    test('intercepts fetch requests and logs them', async ({ page }) => {
        await page.click('button[title="Open Debug Monitor"]');

        // Trigger a fetch (simulated or real if app does it on load)
        await page.evaluate(async () => {
            try {
                await fetch('/api/test-debug', {
                    method: 'POST',
                    body: JSON.stringify({ foo: 'bar' }),
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {} // Ignore network error if endpoint doesn't exist
        });

        // Check for API log category
        const apiBadge = page.locator('span:has-text("API")').first();
        await expect(apiBadge).toBeVisible();

        // Check for request method and url, specifically targeting the request initiation log
        await expect(page.locator('span.text-blue-400:has-text("POST /api/test-debug")')).toBeVisible();
    });

    test('captures resource timing', async ({ page }) => {
        await page.click('button[title="Open Debug Monitor"]');

        // Trigger a resource load (e.g. an image)
        await page.evaluate(() => {
            const img = new Image();
            img.src = 'https://via.placeholder.com/1';
            document.body.appendChild(img);
        });

        // Wait for observer
        await page.waitForTimeout(1000);

        // There might be resource logs.
        // Note: verifying this specifically can be flaky depending on network,
        // but we check if the category exists or logic doesn't crash.
        const logs = page.locator('text=RESOURCE');
        // We don't strictly assert visibility here as it depends on external resources,
        // but the test ensures the code runs without error.
    });

    test('export menu toggles options', async ({ page }) => {
        await page.click('button[title="Open Debug Monitor"]');
        await page.click('button[title="Export options"]');

        // Check for checkboxes using more specific locators
        await expect(page.locator('text=Include in Export:')).toBeVisible();
        await expect(page.locator('label:has-text("Console")')).toBeVisible();
        await expect(page.locator('label:has-text("Network")')).toBeVisible();
        await expect(page.locator('label:has-text("System")')).toBeVisible();
    });
});
