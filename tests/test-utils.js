/**
 * Test Utilities for Playwright Tests
 * 
 * Common helper functions and utilities for E2E tests
 */

/**
 * Wait for the editor to be ready
 * @param {import('@playwright/test').Page} page 
 */
async function waitForEditor(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Find and return the main editor element
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getEditor(page) {
  return page.locator('[contenteditable="true"]').first();
}

/**
 * Type text into the editor
 * @param {import('@playwright/test').Page} page 
 * @param {string} text 
 */
async function typeInEditor(page, text) {
  const editor = await getEditor(page);
  await editor.click();
  await editor.fill(text);
  await page.waitForTimeout(500);
}

/**
 * Select all text in the editor
 * @param {import('@playwright/test').Page} page 
 */
async function selectAllText(page) {
  const editor = await getEditor(page);
  await editor.click({ clickCount: 3 });
  await page.waitForTimeout(500);
}

/**
 * Check if editor exists on the page
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<boolean>}
 */
async function hasEditor(page) {
  const count = await page.locator('[contenteditable="true"]').count();
  return count > 0;
}

/**
 * Wait for toolbar to appear (with timeout)
 * @param {import('@playwright/test').Page} page 
 * @param {number} timeout 
 * @returns {Promise<boolean>}
 */
async function waitForToolbar(page, timeout = 2000) {
  try {
    await page.waitForSelector('[class*="toolbar"], [class*="floating"]', { 
      timeout,
      state: 'visible' 
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take a screenshot with a meaningful name
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check for console errors
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<string[]>}
 */
async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Navigate to editor page with error handling
 * @param {import('@playwright/test').Page} page 
 * @param {string} pageId 
 */
async function goToEditor(page, pageId = 'test-page') {
  await page.goto(`/editor/${pageId}`);
  await waitForEditor(page);
}

/**
 * Mock authentication state
 * @param {import('@playwright/test').Page} page 
 */
async function mockAuth(page) {
  await page.addInitScript(() => {
    // Mock auth token in localStorage
    localStorage.setItem('gh_token', 'mock_token_for_testing');
  });
}

export {
  waitForEditor,
  getEditor,
  typeInEditor,
  selectAllText,
  hasEditor,
  waitForToolbar,
  takeScreenshot,
  getConsoleErrors,
  goToEditor,
  mockAuth,
};
