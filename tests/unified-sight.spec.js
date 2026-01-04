import { test, expect } from '@playwright/test';

test('Unified Sight: File Explorer displays Draft and Live badges', async ({ page }) => {
  // 1. Navigate to the Explorer (via the Wrangler Proxy Port 5173)
  await page.goto('http://localhost:5173/explorer');

  // 2. Wait for the File Cards to render
  const fileCard = page.locator('.file-card').first();
  await expect(fileCard).toBeVisible({ timeout: 15000 });

  // 3. TARGETED SELECTOR: Verify the Draft Badge
  // This looks for the specific Unicode emoji and text within the styled span
  const draftBadge = page.locator('span:has-text("📝 Draft")').first();
  await expect(draftBadge).toBeVisible();
  await expect(draftBadge).toHaveClass(/bg-amber-500/); // Verify it has the Draft styling

  // 4. TARGETED SELECTOR: Verify the Live Badge
  const liveBadge = page.locator('span:has-text("🌐 Live")').first();
  await expect(liveBadge).toBeVisible();
  await expect(liveBadge).toHaveClass(/bg-emerald-500/); // Verify it has the Live styling

  // 5. Audit Screenshot
  await page.screenshot({ path: 'test-results/unified-sight-audit.png' });
  console.log("✅ Audit Passed: Both Draft and Live states are visually represented.");
});
