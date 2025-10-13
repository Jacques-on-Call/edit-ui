import { stylePacks } from './stylePacks.js';

/**
 * @file Visual Render Engine
 * @description Generates HTML for rendering safe previews and detailed fallbacks for Astro layouts.
 */

/**
 * Generates a full HTML document for a successful Astro layout preview.
 * This is a placeholder for the full render engine and will be expanded upon.
 * For now, it displays a simple success message and the raw content.
 *
 * @param {string} fileContent - The raw content of the Astro file.
 * @param {object} frontmatter - The parsed frontmatter object.
 * @param {string[]} components - An array of component names detected in the layout.
 * @returns {string} A complete HTML document as a string.
 */
export function generateAstroPreviewHtml(fileContent, frontmatter, components) {
  // NOTE: This function is now effectively a specific case of the fallback renderer.
  // It's kept separate for clarity, but the logic is similar.
  // The key difference is the "Visual Renderer Active" status.
  const fallbackData = {
    filePath: 'N/A',
    errors: [],
    warnings: ["This is a placeholder preview. Full visual rendering is not yet implemented."],
    frontmatter,
    components,
    islands: []
  };

  return generateFallbackHtml(fallbackData, true, true);
}


/**
 * Generates a rich, diagnostic fallback HTML page.
 * This serves as the "visual debugging layer" and the placeholder view.
 *
 * @param {object} details - An object containing error information.
 * @param {boolean} isPlaceholder - If true, renders a placeholder view instead of an error view.
 * @param {boolean} isSuccess - If true, shows the "Visual Renderer Active" status.
 * @returns {string} A complete HTML document as a string.
 */
export function generateFallbackHtml(details, isPlaceholder = false, isSuccess = false) {
  const { filePath, errors = [], warnings = [], frontmatter = {}, components = [], islands = [] } = details;
  const frontmatterString = JSON.stringify(frontmatter, null, 2);
  const pageTitle = isPlaceholder ? 'Layout Preview' : 'Layout Preview Failed';
  const mainTitle = isPlaceholder ? 'Render Successful (Placeholder)' : 'Layout Preview Failed';
  const mainMessage = isPlaceholder
    ? "This placeholder appears only until visual rendering is fully integrated."
    : `The layout at <code class="text-sm bg-gray-200 p-1 rounded">${filePath}</code> could not be rendered. Here's a summary of what we found.`;

  const themeName = frontmatter.layout?.theme || 'base';
  const activeTheme = stylePacks[themeName] || stylePacks['base'];
  const themeVariables = Object.entries(activeTheme.variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');

  const statusBadge = `
    <div class="fixed top-4 right-4 text-xs font-bold py-1 px-3 rounded-full shadow-md ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
      ${isSuccess ? '🟢 Visual Renderer Active' : '🟠 Placeholder Mode'}
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pageTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        :root {
          ${themeVariables}
        }
        body {
            background-color: var(--theme-bg);
            color: var(--theme-text);
        }
        .card {
          background-color: var(--theme-card-bg);
          border: 1px solid var(--theme-card-border);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          padding: 24px;
          margin-bottom: 24px;
        }
        .tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 12px;
        }
        .tag-error {
          background-color: #FFFBEB;
          color: #B45309;
        }
        .tag-success {
            background-color: #F0FFF4;
            color: #2F855A;
        }
         .tag-warning {
            background-color: #FFFBEB;
            color: #B45309;
        }
      </style>
    </head>
    <body class="bg-gray-50 font-sans">
      ${statusBadge}
      <div class="container mx-auto p-4 md:p-8">

        <div class="card">
          <h1 class="text-2xl font-bold text-gray-800">${mainTitle}</h1>
          <p class="mt-2 text-gray-600">${mainMessage}</p>
        </div>

        ${errors && errors.length > 0 ? `
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-800">Errors</h2>
          <div class="mt-3 space-y-2">
            ${errors.map(err => `
              <div class="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p class="text-sm text-red-700">${err}</p>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${warnings && warnings.length > 0 ? `
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-800">Warnings</h2>
          <div class="mt-3 space-y-2">
            ${warnings.map(warn => `
              <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p class="text-sm text-yellow-700">${warn}</p>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Frontmatter</h2>
            <p class="text-xs text-gray-500 mt-1">This is the data extracted from the '---' block.</p>
            <div class="mt-3 bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
              <pre><code>${frontmatterString}</code></pre>
            </div>
          </div>

          ${frontmatter.layout && Object.keys(frontmatter.layout).length > 0 ? `
          <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Design Tokens</h2>
            <p class="text-xs text-gray-500 mt-1">Active Theme: <span class="font-bold text-blue-600">${activeTheme.name}</span></p>
            <div class="mt-3 bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
              <pre><code>${JSON.stringify(frontmatter.layout, null, 2)}</code></pre>
            </div>
          </div>
          ` : ''}

          <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Detected Components</h2>
             <p class="text-xs text-gray-500 mt-1">These components were found in the file body.</p>
            <div class="mt-3 space-y-2">
              ${components && components.length > 0
                ? components.map(c => `<div class="flex items-center space-x-3"><span class="tag tag-success">${c}</span></div>`).join('')
                : '<p class="text-sm text-gray-500">No components were detected.</p>'
              }
            </div>
          </div>
        </div>

        <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Detected Islands</h2>
            <p class="text-xs text-gray-500 mt-1">These components have a <code class="text-sm bg-gray-200 p-1 rounded">client:</code> directive.</p>
            <div class="mt-3 space-y-2">
                ${islands && islands.length > 0
                    ? islands.map(i => `<div class="flex items-center space-x-3"><span class="tag tag-warning">${i}</span></div>`).join('')
                    : '<p class="text-sm text-gray-500">No client-side islands were detected.</p>'
                }
            </div>
        </div>

      </div>
    </body>
    </html>
  `;
}