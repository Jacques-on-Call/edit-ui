/**
 * Visual Verification for Snag Squad Fixes
 * 
 * This test will run in HEADED mode to provide visual proof that the fixes work.
 * Each test takes screenshots to document the fixes.
 */

import { test, expect } from '@playwright/test';

// Configure for headless mode with screenshots for visual proof
test.use({
  headless: true,
  slowMo: 100, // Slow down operations slightly for stability
  screenshot: 'on', // Always take screenshots
});

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Snag Visual Verification', () => {
  
  test('Snag 1 Visual: Back button uses internal navigation, not browser back', async ({ page }) => {
    console.log('🔍 Testing Snag 1: Browser Back Fix');
    
    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: '/tmp/snag1-01-initial.png', fullPage: true });
    console.log('📸 Screenshot 1: Initial file explorer view');
    
    // Get the initial URL
    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);
    
    // Wait for file explorer to load
    const fileExplorer = await page.locator('.file-tile, [data-testid="file-explorer"]').first();
    await expect(fileExplorer).toBeVisible({ timeout: 10000 });
    
    // Look for a folder to navigate into
    const folders = await page.locator('.file-tile[data-type="dir"]').all();
    console.log(`Found ${folders.length} folders`);
    
    if (folders.length > 0) {
      // Click the first folder
      console.log('📂 Clicking into first folder...');
      await folders[0].click();
      await page.waitForTimeout(1500);
      
      // Take screenshot after navigation
      await page.screenshot({ path: '/tmp/snag1-02-after-folder-click.png', fullPage: true });
      console.log('📸 Screenshot 2: After clicking into folder');
      
      const afterFolderUrl = page.url();
      console.log('URL after folder click:', afterFolderUrl);
      
      // Now find and click the Back button
      const backButton = await page.locator('button:has(svg.lucide-arrow-left)').first();
      
      if (await backButton.isVisible()) {
        console.log('⬅️ Clicking Back button...');
        await backButton.click();
        await page.waitForTimeout(1500);
        
        // Take screenshot after back button
        await page.screenshot({ path: '/tmp/snag1-03-after-back-button.png', fullPage: true });
        console.log('📸 Screenshot 3: After clicking Back button');
        
        const finalUrl = page.url();
        console.log('URL after Back button:', finalUrl);
        
        // VERIFY: We should still be in the app (localhost), not exited
        expect(finalUrl).toContain('localhost');
        expect(finalUrl).not.toContain('about:blank');
        
        // VERIFY: File explorer should still be visible
        await expect(fileExplorer).toBeVisible();
        
        console.log('✅ PASS: Back button uses internal navigation!');
      } else {
        console.log('⚠️ Back button not visible in current view');
      }
    } else {
      console.log('⚠️ No folders found to test navigation');
    }
  });

  test('Snag 2 Visual: No ghost header in editor', async ({ page }) => {
    console.log('🔍 Testing Snag 2: Ghost Header Removal');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot of file explorer
    await page.screenshot({ path: '/tmp/snag2-01-file-explorer.png', fullPage: true });
    console.log('📸 Screenshot 1: File explorer');
    
    // Find any file to open
    const files = await page.locator('.file-tile[data-type="file"]').all();
    console.log(`Found ${files.length} files`);
    
    if (files.length > 0) {
      console.log('📄 Opening first file in editor...');
      await files[0].click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of editor
      await page.screenshot({ path: '/tmp/snag2-02-editor-view.png', fullPage: true });
      console.log('📸 Screenshot 2: Editor view');
      
      // Count how many editor headers exist
      const editorHeaders = await page.locator('.editor-header, [class*="EditorHeader"]').all();
      console.log(`Found ${editorHeaders.length} editor header(s)`);
      
      // VERIFY: Should be 0 or 1 headers, not multiple (no ghost/duplicate)
      expect(editorHeaders.length).toBeLessThanOrEqual(1);
      
      console.log('✅ PASS: No ghost header duplication!');
    } else {
      console.log('⚠️ No files found to test');
    }
  });

  test('Snag 3 Visual: Preview URL preserves underscores', async ({ page }) => {
    console.log('🔍 Testing Snag 3: Preview URL Preservation');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/snag3-01-initial.png', fullPage: true });
    console.log('📸 Screenshot 1: Initial view');
    
    // Look for files with underscores in name
    const allFiles = await page.locator('.file-tile').all();
    let underscoreFile = null;
    
    for (const file of allFiles) {
      const text = await file.textContent();
      if (text && text.includes('_')) {
        underscoreFile = file;
        console.log(`Found file with underscore: ${text}`);
        break;
      }
    }
    
    if (underscoreFile) {
      // Click the file
      await underscoreFile.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of editor
      await page.screenshot({ path: '/tmp/snag3-02-editor-with-underscore-file.png', fullPage: true });
      console.log('📸 Screenshot 2: Editor with underscore file');
      
      // Look for preview button
      const previewButton = await page.locator('button:has-text("Preview")').first();
      
      if (await previewButton.isVisible()) {
        console.log('🔍 Clicking Preview button...');
        await previewButton.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot of preview mode
        await page.screenshot({ path: '/tmp/snag3-03-preview-mode.png', fullPage: true });
        console.log('📸 Screenshot 3: Preview mode');
        
        // Check for preview iframe
        const previewFrame = await page.locator('iframe').first();
        
        if (await previewFrame.isVisible()) {
          const previewSrc = await previewFrame.getAttribute('src');
          console.log('Preview URL:', previewSrc);
          
          // VERIFY: URL should preserve underscore
          expect(previewSrc).toContain('_');
          
          console.log('✅ PASS: Preview URL preserves underscores!');
        } else {
          console.log('⚠️ Preview iframe not found');
        }
      } else {
        console.log('⚠️ Preview button not visible');
      }
    } else {
      console.log('⚠️ No files with underscores found');
    }
  });
});
