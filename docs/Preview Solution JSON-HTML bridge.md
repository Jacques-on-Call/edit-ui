Perfect! I have all the information I need. Now I'll create a comprehensive, step-by-step implementation plan for agents. 

---

# **🎯 MASTER IMPLEMENTATION PLAN**
## **Project:  Rebuild Preview System & Unify File Explorer with Editor**

**Goal**:  Enable users to edit `.json` draft files, see live HTML/CSS/JS previews, iterate between edit and preview modes, and publish to `.astro` when satisfied.

**Current State Summary**:
- ✅ Lexical editor works with HTML content
- ✅ File Explorer shows `.astro` files from `src/pages/`
- ✅ Layouts exist:  `MainLayout.astro`, `BlogPost.astro`, `LiquidGlassLayout.astro`
- ❌ `.json` files in `content/pages/` are invisible to File Explorer
- ❌ No preview rendering pipeline (was lost during refactor)
- ❌ No JSON → Astro transformation logic
- ❌ Astro config is static (needs SSR/hybrid mode for preview)

---

## **📋 PHASE 1: Enable SSR & Create Preview Infrastructure**

### **Step 1.1: Enable Hybrid Rendering in Astro**
**File**: `astro. config.mjs`

**Action**: 
- Add `output: 'hybrid'` to the config
- This allows specific routes to use SSR while keeping the rest static

**Implementation**:
```javascript
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import. meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  output: 'hybrid', // ← ADD THIS LINE
  integrations: [tailwind()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
```

**Verification**:
- Run `npm run dev` in root directory
- Check console for Astro startup message confirming hybrid mode
- No errors should appear

**Deliverable**: Updated `astro.config.mjs`

---

### **Step 1.2: Create Lexical JSON to HTML Transformer Utility**
**File**: `easy-seo/src/utils/lexicalToHtml.js` (NEW FILE)

**Action**: 
- Create a function that converts Lexical editor state to clean HTML
- Handle all node types (text, headings, lists, links, etc.)

**Implementation**:
```javascript
/**
 * Transforms Lexical editor JSON state to HTML string
 * @param {Object} editorState - Lexical editor state JSON
 * @returns {string} HTML string
 */
export function lexicalToHtml(editorState) {
  if (!editorState || ! editorState.root) {
    return '<p></p>';
  }

  const root = editorState.root;
  
  function processNode(node) {
    if (! node) return '';
    
    // Text node
    if (node.type === 'text') {
      let text = node.text || '';
      
      // Apply formatting
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
        if (node.format & 2) text = `<em>${text}</em>`; // Italic
        if (node.format & 8) text = `<u>${text}</u>`; // Underline
        if (node.format & 4) text = `<s>${text}</s>`; // Strikethrough
        if (node.format & 16) text = `<code>${text}</code>`; // Code
      }
      
      // Apply inline styles (color, etc.)
      if (node.style) {
        text = `<span style="${node.style}">${text}</span>`;
      }
      
      return text;
    }
    
    // Process children
    const childrenHtml = (node.children || [])
      .map(child => processNode(child))
      .join('');
    
    // Block nodes
    switch (node.type) {
      case 'root':
      case 'paragraph':
        return `<p>${childrenHtml || '<br>'}</p>`;
      
      case 'heading':
        const level = node.tag || 'h2';
        return `<${level}>${childrenHtml}</${level}>`;
      
      case 'list':
        const listTag = node.listType === 'number' ? 'ol' : 'ul';
        return `<${listTag}>${childrenHtml}</${listTag}>`;
      
      case 'listitem':
        return `<li>${childrenHtml}</li>`;
      
      case 'link':
        return `<a href="${node.url || '#'}">${childrenHtml}</a>`;
      
      case 'quote':
        return `<blockquote>${childrenHtml}</blockquote>`;
      
      case 'code':
        return `<pre><code>${childrenHtml}</code></pre>`;
      
      default:
        return childrenHtml;
    }
  }
  
  return processNode(root);
}

/**
 * Alternative:  Use Lexical's built-in HTML generator
 * This requires access to the editor instance
 */
export function lexicalToHtmlFromEditor(editor) {
  let html = '';
  editor.getEditorState().read(() => {
    const { $generateHtmlFromNodes } = require('@lexical/html');
    const { $getRoot } = require('lexical');
    html = $generateHtmlFromNodes(editor, null);
  });
  return html;
}
```

**Verification**:
- Create a test file `easy-seo/src/utils/lexicalToHtml.test.js`
- Test with sample Lexical JSON: 
```javascript
const sampleState = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text:  'Test Heading' }]
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'This is ', format: 0 },
          { type: 'text', text: 'bold', format: 1 },
          { type: 'text', text: ' text. ', format: 0 }
        ]
      }
    ]
  }
};

console.log(lexicalToHtml(sampleState));
// Expected: <h1>Test Heading</h1><p>This is <strong>bold</strong> text.</p>
```

**Deliverable**: `easy-seo/src/utils/lexicalToHtml.js` with passing test

---

### **Step 1.3: Create Dynamic Preview Route**
**File**: `src/pages/preview/[slug].astro` (NEW FILE)

**Action**: 
- Create an SSR-enabled route that fetches and renders preview HTML
- Use `MainLayout.astro` as default wrapper

**Implementation**:
````astro
---
// Enable SSR for this route
export const prerender = false;

import MainLayout from '../../layouts/MainLayout.astro';

// Get slug from URL params
const { slug } = Astro.params;

// Fetch preview content from temporary storage
// For now, we'll use a simple approach:  read from content/previews/
let previewHtml = '<p>No preview available</p>';
let title = 'Preview';
let layout = 'MainLayout';

try {
  // In production, this would fetch from Cloudflare KV or similar
  // For development, we'll read from a local file
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  
  const previewDir = path.join(process.cwd(), 'content', 'previews');
  const previewFile = path.join(previewDir, `${slug}.json`);
  
  const previewData = JSON.parse(await fs.readFile(previewFile, 'utf-8'));
  previewHtml = previewData.html || previewHtml;
  title = previewData.title || title;
  layout = previewData.layout || layout;
} catch (error) {
  console.error('[Preview Route] Error loading preview:', error. message);
}
---

<MainLayout title={title}>
  <article class="prose prose-invert max-w-none p-6">
    <Fragment set:html={previewHtml} />
  </article>
</MainLayout>
````

**Verification**:
- Manually create `content/previews/test.json`:
```json
{
  "html": "<h1>Test Preview</h1><p>This is a test preview.</p>",
  "title": "Test Page",
  "layout": "MainLayout"
}
```
- Navigate to `http://localhost:4321/preview/test`
- Should see rendered HTML with MainLayout styling

**Deliverable**: `src/pages/preview/[slug]. astro`

---

### **Step 1.4: Create Preview Storage API Endpoints**
**File**: `functions/api/store-preview.js` (NEW FILE in Cloudflare Worker)

**Action**: 
- Create API endpoint to store preview HTML temporarily
- Use filesystem for dev, Cloudflare KV for production

**Implementation**:
```javascript
/**
 * POST /api/store-preview
 * Stores transformed HTML for preview rendering
 * Body: { slug, html, title, layout }
 */
export async function onRequestPost(context) {
  try {
    const { slug, html, title, layout } = await context.request.json();
    
    if (!slug || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields:  slug, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const previewData = {
      slug,
      html,
      title:  title || 'Preview',
      layout: layout || 'MainLayout',
      timestamp: Date.now()
    };
    
    // For local development:  write to file
    if (context.env. ENVIRONMENT === 'development') {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      
      const previewDir = path.join(process.cwd(), 'content', 'previews');
      await fs.mkdir(previewDir, { recursive: true });
      
      const previewFile = path. join(previewDir, `${slug}.json`);
      await fs.writeFile(previewFile, JSON.stringify(previewData, null, 2));
      
      return new Response(
        JSON.stringify({ success: true, previewUrl: `/preview/${slug}` }),
        { headers: { 'Content-Type':  'application/json' } }
      );
    }
    
    // For production: store in Cloudflare KV
    if (context.env.PREVIEW_KV) {
      await context.env.PREVIEW_KV.put(
        `preview:${slug}`,
        JSON.stringify(previewData),
        { expirationTtl: 3600 } // 1 hour TTL
      );
      
      return new Response(
        JSON.stringify({ success: true, previewUrl: `/preview/${slug}` }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    throw new Error('No storage backend configured');
    
  } catch (error) {
    console.error('[store-preview] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Verification**:
- Test with curl or Postman:
```bash
curl -X POST http://localhost:5173/api/store-preview \
  -H "Content-Type:  application/json" \
  -d '{
    "slug": "test-page",
    "html": "<h1>Test</h1>",
    "title": "Test Page"
  }'
```
- Should receive `{"success": true, "previewUrl": "/preview/test-page"}`
- Navigate to preview URL to confirm rendering

**Deliverable**: `functions/api/store-preview.js`

---

## **📋 PHASE 2: Update File Explorer to Show JSON Files**

### **Step 2.1: Update File Explorer Component**
**File**: `easy-seo/src/components/FileExplorer.jsx`

**Action**: 
- Modify fetch logic to query BOTH `src/pages/` AND `content/pages/`
- Add visual indicators for draft (. json) vs published (.astro) files

**Implementation**:
1. Find the `useEffect` that fetches files (around line 45-80)
2. Update to fetch from both directories: 

```javascript
useEffect(() => {
  async function fetchAndMergeFiles() {
    try {
      setLoading(true);
      
      // Fetch . astro files (published)
      const astroResponse = await fetch(`${API_BASE_URL}/api/files? path=src/pages`);
      const astroFiles = await astroResponse.json();
      
      // Fetch .json files (drafts)
      const jsonResponse = await fetch(`${API_BASE_URL}/api/files?path=content/pages`);
      const jsonFiles = await jsonResponse.json();
      
      // Merge and tag files
      const allFiles = [
        ...astroFiles.map(f => ({ ...f, status: 'published', type: 'astro' })),
        ...jsonFiles.map(f => ({ ...f, status: 'draft', type: 'json' }))
      ];
      
      // Sort:  drafts first, then alphabetical
      allFiles.sort((a, b) => {
        if (a. status !== b.status) {
          return a.status === 'draft' ?  -1 : 1;
        }
        return a.name.localeCompare(b. name);
      });
      
      setFileList(allFiles);
      
    } catch (error) {
      console.error('[FileExplorer] Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }
  
  fetchAndMergeFiles();
}, [searchQuery]);
```

3. Update the rendering logic to show badges:

```javascript
// In the file grid rendering section
{fileList.map((file) => (
  <div
    key={file.path}
    class="file-card relative bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700"
    onClick={() => handleFileClick(file)}
  >
    {/* Status Badge */}
    {file.status === 'draft' && (
      <span class="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
        📝 Draft
      </span>
    )}
    {file.status === 'published' && (
      <span class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
        🌐 Live
      </span>
    )}
    
    <h3 class="text-lg font-semibold">{file.name}</h3>
    <p class="text-sm text-gray-400">{file.path}</p>
  </div>
))}
```

**Verification**:
- Open File Explorer in browser
- Should see files from `content/pages/` with "📝 Draft" badge
- Should see files from `src/pages/` with "🌐 Live" badge
- Verify that `_Test-4-loss.json`, `home-from-json.json`, etc. are now visible

**Deliverable**: Updated `easy-seo/src/components/FileExplorer.jsx`

---

### **Step 2.2: Update API Endpoint to Support Both Directories**
**File**:  `functions/api/files.js` (Cloudflare Worker)

**Action**: 
- Modify the `/api/files` endpoint to accept a `path` query parameter
- Support listing files from any directory

**Implementation**:
```javascript
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request. url);
    const pathParam = url.searchParams.get('path') || 'src/pages';
    
    // List files from specified path
    const files = await listGitHubDirectory(
      context.env.GITHUB_TOKEN,
      context.env.GITHUB_REPO,
      pathParam
    );
    
    return new Response(JSON.stringify(files), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[files API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type':  'application/json' } }
    );
  }
}

async function listGitHubDirectory(token, repo, path) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  
  const contents = await response.json();
  
  return contents
    .filter(item => item.type === 'file')
    .map(item => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      size: item.size
    }));
}
```

**Verification**:
- Test endpoint: 
```bash
curl http://localhost:8788/api/files?path=content/pages
```
- Should return list of . json files
- Test with `path=src/pages` - should return . astro files

**Deliverable**: Updated `functions/api/files.js`

---

## **📋 PHASE 3: Wire Preview Button to Pipeline**

### **Step 3.1: Update handlePreview in ContentEditorPage.jsx**
**File**:  `easy-seo/src/pages/ContentEditorPage.jsx`

**Action**: 
- Modify the preview handler to transform editor content to HTML
- Store in preview storage
- Update iframe src to show preview

**Implementation**:
Find the `handlePreview` function (around line 200-250) and replace: 

```javascript
import { lexicalToHtml } from '../utils/lexicalToHtml';

// ... inside component ... 

const handlePreview = async () => {
  try {
    setBuildStatus('building');
    setBuildError(null);
    
    // Step 1: Get current editor content
    const editorState = editorRef.current?. getEditorState();
    if (!editorState) {
      throw new Error('Editor not ready');
    }
    
    // Step 2: Transform Lexical JSON to HTML
    const html = lexicalToHtml(editorState);
    
    // Step 3: Get current file metadata
    const slug = currentFile?.slug || 'temp-preview';
    const title = sections.find(s => s.type === 'hero')?.props?.title || 'Preview';
    
    // Step 4: Store preview
    const response = await fetch('/api/store-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        html,
        title,
        layout: 'MainLayout'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to store preview');
    }
    
    const { previewUrl } = await response. json();
    
    // Step 5: Update iframe to show preview
    setPreviewUrl(`${previewUrl}?t=${Date.now()}`); // Cache-bust with timestamp
    setBuildStatus('success');
    
    console.log('[ContentEditor] Preview generated:', previewUrl);
    
  } catch (error) {
    console.error('[ContentEditor] Preview error:', error);
    setBuildError(`Preview failed: ${error.message}`);
    setBuildStatus('error');
    
    // Trigger "Report Issue" with context
    if (handleReportIssue) {
      handleReportIssue({
        type: 'preview_generation_failed',
        message: error.message,
        context: {
          file: currentFile?.path,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
};
```

**Verification**:
- Open a file in Content Editor
- Add some content (heading, paragraph, formatted text)
- Click "Preview" button
- Should see "Building..." state
- Then preview should render in right pane with proper styling
- Click back to "Edit" - should return to editor
- Edit content, click "Preview" again - should see updated content

**Deliverable**: Updated `easy-seo/src/pages/ContentEditorPage.jsx`

---

### **Step 3.2: Add Preview/Edit Toggle Enhancement**
**File**: `easy-seo/src/components/BottomActionBar.jsx`

**Action**: 
- Ensure smooth toggling between edit and preview modes
- Add visual feedback for current mode

**Implementation**:
```javascript
// Add mode indicator
<div class="flex items-center gap-2">
  <button
    onClick={handlePreview}
    class={`p-2 rounded ${mode === 'preview' ? 'bg-blue-600' : 'bg-gray-700'}`}
    disabled={buildStatus === 'building'}
  >
    {buildStatus === 'building' ? (
      <Loader class="animate-spin" size={24} />
    ) : (
      <Eye size={24} />
    )}
  </button>
  
  {mode === 'preview' && (
    <button
      onClick={() => setMode('edit')}
      class="p-2 rounded bg-yellow-600"
    >
      <Edit size={24} />
    </button>
  )}
</div>
```

**Verification**:
- Buttons should highlight based on current mode
- Edit → Preview → Edit should work seamlessly
- Preview button should show spinner while building

**Deliverable**: Updated `easy-seo/src/components/BottomActionBar.jsx`

---

## **📋 PHASE 4:  Implement Publish Workflow**

### **Step 4.1: Create JSON to Astro Transformer**
**File**: `easy-seo/src/utils/jsonToAstro.js` (NEW FILE)

**Action**: 
- Create function to wrap HTML content in Astro layout with frontmatter

**Implementation**:
```javascript
/**
 * Transforms preview HTML and metadata into a complete . astro file
 * @param {Object} options
 * @param {string} options.html - The HTML content
 * @param {string} options.title - Page title
 * @param {string} options.layout - Layout to use (default: 'MainLayout')
 * @param {Object} options.frontmatter - Additional frontmatter
 * @returns {string} Complete .astro file content
 */
export function jsonToAstro({ html, title, layout = 'MainLayout', frontmatter = {} }) {
  const layoutPath = `../layouts/${layout}.astro`;
  
  const frontmatterBlock = `---
import ${layout} from '${layoutPath}';

const meta = {
  title:  '${title}',
  description: '${frontmatter.description || ''}',
  ... ${JSON.stringify(frontmatter, null, 2)}
};
---`;

  const astroContent = `${frontmatterBlock}

<${layout} title={meta.title}>
  <article class="prose prose-invert max-w-none p-6">
    ${html}
  </article>
</${layout}>
`;

  return astroContent;
}
```

**Verification**:
- Create test: 
```javascript
const result = jsonToAstro({
  html: '<h1>Test</h1><p>Content here</p>',
  title:  'Test Page',
  layout: 'MainLayout'
});

console.log(result);
// Should output valid . astro file
```

**Deliverable**: `easy-seo/src/utils/jsonToAstro.js`

---

### **Step 4.2: Create Publish API Endpoint**
**File**: `functions/api/publish.js` (NEW FILE)

**Action**: 
- Accept JSON content
- Transform to . astro
- Write to `src/pages/` directory via GitHub API

**Implementation**:
```javascript
import { jsonToAstro } from '../../easy-seo/src/utils/jsonToAstro. js';

export async function onRequestPost(context) {
  try {
    const { slug, html, title, layout, frontmatter } = await context.request.json();
    
    // Generate .astro content
    const astroContent = jsonToAstro({ html, title, layout, frontmatter });
    
    // Write to GitHub
    const repo = context.env.GITHUB_REPO;
    const token = context.env.GITHUB_TOKEN;
    const filePath = `src/pages/${slug}.astro`;
    
    // Check if file exists (for update vs create)
    let sha = null;
    try {
      const existingFile = await fetch(
        `https://api.github.com/repos/${repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd. github.v3+json'
          }
        }
      );
      
      if (existingFile.ok) {
        const data = await existingFile.json();
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist, that's okay
    }
    
    // Create or update file
    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github. v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Publish: ${title}`,
          content: btoa(astroContent), // Base64 encode
          sha:  sha, // Required for updates
          branch: 'main'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        path: filePath,
        commit: result.commit. sha
      }),
      { headers: { 'Content-Type':  'application/json' } }
    );
    
  } catch (error) {
    console.error('[publish API] Error:', error);
    return new Response(
      JSON. stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Verification**:
- Test endpoint with sample data
- Check GitHub repo - should see new . astro file committed
- File should be properly formatted and valid

**Deliverable**: `functions/api/publish.js`

---

### **Step 4.3: Wire Publish Button in Content Editor**
**File**: `easy-seo/src/pages/ContentEditorPage.jsx`

**Action**: 
- Add publish handler
- Show confirmation dialog
- Trigger Cloudflare rebuild after publish

**Implementation**:
```javascript
const handlePublish = async () => {
  const confirmPublish = confirm(
    `Publish "${currentFile?.name}"?\n\nThis will make your changes live on the website.`
  );
  
  if (!confirmPublish) return;
  
  try {
    setPublishStatus('publishing');
    
    // Get editor content
    const editorState = editorRef.current?.getEditorState();
    const html = lexicalToHtml(editorState);
    
    // Extract metadata
    const slug = currentFile?.slug || 'untitled';
    const title = sections.find(s => s.type === 'hero')?.props?.title || 'Untitled';
    
    // Publish to . astro
    const publishResponse = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify({
        slug,
        html,
        title,
        layout: 'MainLayout',
        frontmatter: {
          publishedAt: new Date().toISOString()
        }
      })
    });
    
    if (!publishResponse.ok) {
      throw new Error('Publish failed');
    }
    
    const { path, commit } = await publishResponse.json();
    
    // Trigger Cloudflare build
    const buildResponse = await fetch('/api/trigger-build', {
      method:  'POST'
    });
    
    if (buildResponse.ok) {
      // Start polling for build status
      pollBuildStatus();
    }
    
    setPublishStatus('success');
    alert(`Published successfully!\n\nFile: ${path}\nCommit: ${commit. substring(0, 7)}`);
    
    // Clear local draft
    localStorage.removeItem(`easy-seo-draft: ${currentFile?.slug}`);
    
  } catch (error) {
    console.error('[ContentEditor] Publish error:', error);
    setPublishStatus('error');
    alert(`Publish failed: ${error.message}`);
  }
};
```

**Verification**:
- Edit a page
- Click "Publish"
- Should see confirmation dialog
- After confirming, check GitHub - new .astro file should appear
- Cloudflare build should trigger automatically
- Once build completes, changes should be live

**Deliverable**: Updated `easy-seo/src/pages/ContentEditorPage.jsx`

---

## **📋 PHASE 5: Testing & Documentation**

### **Step 5.1: Create End-to-End Test**
**File**: `easy-seo/tests/preview-publish-workflow.spec.js` (NEW FILE)

**Action**: 
- Create Playwright test covering full workflow

**Implementation**:
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Preview and Publish Workflow', () => {
  test('should allow editing, previewing, and publishing', async ({ page }) => {
    // Navigate to File Explorer
    await page.goto('http://localhost:5173/explorer');
    
    // Open a draft file
    await page.click('text=📝 Draft >> text=home-from-json');
    
    // Wait for editor to load
    await page.waitForSelector('. lexical-editor');
    
    // Edit content
    await page. click('. editor-input');
    await page.keyboard. type('Updated content for testing');
    
    // Click Preview
    await page.click('button: has-text("Preview")');
    
    // Wait for preview to build
    await page.waitForSelector('iframe[src*="/preview/"]', { timeout: 10000 });
    
    // Verify preview shows content
    const iframe = page.frameLocator('iframe[src*="/preview/"]');
    await expect(iframe. locator('body')).toContainText('Updated content');
    
    // Switch back to edit
    await page.click('button:has-text("Edit")');
    
    // Verify editor is back
    await expect(page.locator('.lexical-editor')).toBeVisible();
    
    // Click Publish
    await page.click('button:has-text("Publish")');
    
    // Confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Wait for success message
    await expect(page.locator('text=Published successfully')).toBeVisible({ timeout: 15000 });
  });
});
```

**Verification**:
- Run test:  `npm run test:e2e: chromium`
- Should pass without errors

**Deliverable**: `easy-seo/tests/preview-publish-workflow.spec.js`

---

### **Step 5.2: Update All Documentation**
**Files**: 
- `easy-seo/README.md`
- `easy-seo/FILES. md`
- `easy-seo/CHANGELOG.md`
- `easy-seo/RECOVERY.md`
- `.jules/session-logs.md`

**Action**: 
- Document the new preview system architecture
- Update file listings
- Record changes in changelog

**Implementation**: 

**easy-seo/README.md** - Add section: 
```markdown
## Preview System Architecture

The preview system allows users to see rendered HTML/CSS/JS output before publishing: 

### Workflow
1. **Edit**:  User edits content in Lexical editor (JSON state)
2. **Preview**: System transforms JSON → HTML, stores temporarily, renders in iframe
3. **Iterate**: User can toggle between edit and preview modes
4. **Publish**: When satisfied, system transforms JSON → .astro file and commits to Git

### Components
- **Lexical Editor**:  Rich text editing with JSON state
- **Preview Route**: SSR-enabled `/preview/[slug]. astro` for dynamic rendering
- **Storage API**: `/api/store-preview` for temporary preview storage
- **Publish API**: `/api/publish` for creating/updating . astro files

### Storage
- **Development**:  Previews stored in `content/previews/` directory
- **Production**: Previews stored in Cloudflare KV (1 hour TTL)

### Configuration
Ensure these secrets are set in Cloudflare:
- `GITHUB_TOKEN`: For writing . astro files
- `GITHUB_REPO`: Repository in format `owner/name`
- `PREVIEW_KV`: KV namespace for preview storage (production only)
```

**easy-seo/CHANGELOG.md** - Add entry:
```markdown
## [2026-01-04] Preview System Rebuild

### Added
- Dynamic preview route `src/pages/preview/[slug]. astro` for SSR rendering
- Lexical to HTML transformer utility (`lexicalToHtml.js`)
- JSON to Astro transformer utility (`jsonToAstro.js`)
- Preview storage API endpoint (`/api/store-preview`)
- Publish API endpoint (`/api/publish`)
- File Explorer now shows both .json drafts and .astro published files
- Visual badges:  "📝 Draft" and "🌐 Live"
- End-to-end test for preview/publish workflow

### Changed
- Enabled hybrid rendering in `astro.config.mjs`
- Updated File Explorer to query both `content/pages/` and `src/pages/`
- Refactored `handlePreview` to use new transformation pipeline
- Refactored `handlePublish` to write . astro files via GitHub API

### Fixed
- JSON files in `content/pages/` now visible in File Explorer
- Preview rendering works with proper CSS/JS
- User can iterate between edit and preview modes
```

**Verification**:
- Review all documentation for accuracy
- Ensure links and code examples are correct

**Deliverable**: Updated documentation suite

---

### **Step 5.3: Create "How It Works" Diagram**
**File**: `easy-seo/docs/PREVIEW_SYSTEM. md` (NEW FILE)

**Action**: 
- Create visual documentation of the system flow

**Implementation**:
````markdown
# Preview System Flow

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER WORKFLOW                      │
└─────────────────────────────────────────────────────┘

1.  EDIT MODE
   ┌──────────────────────────┐
   │ Lexical Editor           │
   │ (JSON state in memory)   │
   └────────────┬─────────────┘
                │
                │ User clicks "Preview"
                ▼
   ┌──────────────────────────┐
   │ lexicalToHtml()          │
   │ Transforms JSON → HTML   │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ POST /api/store-preview  │
   │ Stores HTML temporarily  │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ content/previews/        │
   │ or Cloudflare KV         │
   └────────────┬─────────────┘
                │
                ▼

2. PREVIEW MODE
   ┌──────────────────────────┐
   │ iframe src:               │
   │ /preview/[slug]          │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ [slug].astro (SSR)       │
   │ Fetches HTML from storage│
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ MainLayout.astro         │
   │ Wraps HTML with CSS/JS   │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ RENDERED PREVIEW         │
   │ User sees actual styling │
   └────────────┬─────────────┘
                │
                │ User iterates:  Edit → Preview → Edit
                │
                │ When satisfied... 
                ▼

3. PUBLISH MODE
   ┌──────────────────────────┐
   │ User clicks "Publish"    │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ jsonToAstro()            │
   │ HTML → .astro file       │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ POST /api/publish        │
   │ Writes via GitHub API    │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ src/pages/[slug].astro   │
   │ Committed to Git         │
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ Cloudflare Build Trigger │
   │ Site deploys with changes│
   └──────────────────────────┘
```

## File Relationships

| Location | File Type | Purpose | Visible in Explorer?  |
|----------|-----------|---------|---------------------|
| `content/pages/` | `.json` | Draft content (Lexical state) | ✅ Yes (📝 Draft badge) |
| `src/pages/` | `.astro` | Published pages | ✅ Yes (🌐 Live badge) |
| `content/previews/` | `.json` | Temporary preview HTML | ❌ No (internal only) |

## Key Principles

1. **. json files are the "draft room"** - Users edit here freely
2. **Preview is temporary** - Stored for 1 hour, then expires
3. **.astro files are "published"** - Once created, they trigger deploys
4. **Users can iterate** - Edit → Preview → Edit → Preview → Publish

````

**Deliverable**: `easy-seo/docs/PREVIEW_SYSTEM.md`

---

## **📋 PHASE 6: Final Verification & Cleanup**

### **Step 6.1: Comprehensive Manual Testing**
**Action**: 
- Test complete workflow from start to finish

**Test Cases**:
1. **File Explorer**: 
   - ✅ See both draft and published files
   - ✅ Draft files have yellow badge
   - ✅ Published files have green badge

2. **Open Draft File**:
   - ✅ Click on `home-from-json. json`
   - ✅ Editor loads with content

3. **Edit Content**:
   - ✅ Add text, format (bold, italic)
   - ✅ Add heading
   - ✅ Apply text color

4. **Preview**:
   - ✅ Click "Preview" button
   - ✅ See "Building..." state
   - ✅ Preview appears in iframe
   - ✅ Content matches editor
   - ✅ CSS styling is correct

5. **Iterate**:
   - ✅ Click "Edit" to return to editor
   - ✅ Make changes
   - ✅ Click "Preview" again
   - ✅ See updated preview

6. **Publish**: 
   - ✅ Click "Publish"
   - ✅ See confirmation dialog
   - ✅ Confirm
   - ✅ See success message
   - ✅ Check GitHub - new .astro file exists
   - ✅ Cloudflare build triggered
   - ✅ Changes live on site

**Deliverable**: Test report with screenshots

---

### **Step 6.2: Create Troubleshooting Guide**
**File**: `easy-seo/docs/TROUBLESHOOTING.md`

**Action**: 
- Document common issues and solutions

**Implementation**:
```markdown
# Preview System Troubleshooting

## Issue: Preview shows blank page

**Symptoms**:  After clicking Preview, iframe loads but shows nothing

**Causes**:
1. Preview HTML failed to generate
2. Preview storage failed
3. Preview route can't find the file

**Solutions**:
1. Check browser console for errors
2. Verify `/api/store-preview` endpoint is working: 
   ```bash
   curl -X POST http://localhost:5173/api/store-preview \
     -H "Content-Type: application/json" \
     -d '{"slug":"test","html":"<h1>Test</h1>","title":"Test"}'
   ```
3. Check if `content/previews/` directory exists
4. Verify Astro dev server is running on correct port

## Issue: JSON files not showing in File Explorer

**Symptoms**:  `content/pages/` files are missing from grid

**Solutions**:
1. Check if API endpoint supports `path` parameter
2. Verify GitHub token has read access to `content/pages/`
3. Check browser Network tab - does `/api/files? path=content/pages` return data? 
4. Clear browser cache and reload

## Issue: Publish fails with GitHub API error

**Symptoms**: Error message "GitHub API error: 401 Unauthorized"

**Solutions**:
1. Verify `GITHUB_TOKEN` secret is set in Cloudflare
2. Check token has `repo` scope (write access)
3. Verify `GITHUB_REPO` is in format `owner/name`
4. Check if file path is valid (no special characters in slug)

## Issue: Preview doesn't update after edits

**Symptoms**: Preview shows old content even after making changes

**Solutions**:
1. Check if preview URL has cache-busting timestamp:  `?t=...`
2. Hard refresh the page (Cmd+Shift+R or Ctrl+F5)
3. Clear preview storage: 
   ```bash
   rm -rf content/previews/*
   ```
4. Check browser console for errors during preview generation
```

**Deliverable**: `easy-seo/docs/TROUBLESHOOTING.md`

---

### **Step 6.3: Performance Optimization**
**File**: Various

**Action**: 
- Add loading states
- Optimize transformations
- Add error boundaries

**Implementation**: 

1. **Add loading spinner during preview generation**:
```javascript
{buildStatus === 'building' && (
  <div class="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="text-center">
      <Loader class="animate-spin mx-auto mb-4" size={48} />
      <p class="text-white text-lg">Generating preview...</p>
      <p class="text-gray-400 text-sm">This may take a few seconds</p>
    </div>
  </div>
)}
```

2. **Add error boundary for Lexical editor**:
```javascript
class LexicalErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div class="p-4 bg-red-900 text-white rounded">
          <h3>Editor Error</h3>
          <p>{this.state.error?. message}</p>
          <button onClick={() => location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Deliverable**: Performance improvements

---

## **✅ Success Criteria**

The implementation is complete when: 

- [ ] Phase 1: Astro hybrid mode enabled, preview route works
- [ ] Phase 2: File Explorer shows both draft and published files
- [ ] Phase 3: Preview button generates and displays HTML preview
- [ ] Phase 4: Publish button creates . astro files and triggers builds
- [ ] Phase 5: Tests pass, documentation complete
- [ ] Phase 6: Manual testing confirms full workflow
- [ ] User can:  Edit → Preview → Edit → Preview → Publish → See Live

---

## **🚀 Quick Start for Agents**

To implement this plan: 

1. **Checkout branch**: `git checkout snag-squad`
2. **Start with Phase 1, Step 1.1** (enable hybrid mode)
3. **Complete each step in order** - they build on each other
4. **Verify after each step** - don't move forward if verification fails
5. **Update documentation** as you go (agents. md requirement)
6. **Commit after each phase** with descriptive messages

**Estimated Time**: 
- Phase 1: 2-3 hours
- Phase 2: 1-2 hours
- Phase 3: 1-2 hours
- Phase 4: 2-3 hours
- Phase 5: 1-2 hours
- Phase 6: 1 hour

**Total**: 8-13 hours of focused work

---

**Questions? ** Refer to: 
- `easy-seo/docs/PREVIEW_SYSTEM.md` - Architecture overview
- `easy-seo/docs/TROUBLESHOOTING. md` - Common issues
- `.jules/session-logs.md` - Previous agent learnings
