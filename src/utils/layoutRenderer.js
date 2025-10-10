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
  const title = frontmatter.title || 'Astro Layout Preview';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 p-8 font-sans">
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-green-600">Render Successful (Placeholder)</h1>
        <p class="mt-2 text-gray-700">This is a placeholder for the full visual renderer. Below is the data that would be used to construct the preview.</p>
        <div class="mt-4">
          <h2 class="text-lg font-semibold">Frontmatter</h2>
          <pre class="bg-gray-200 p-3 rounded mt-1 text-sm"><code>${JSON.stringify(frontmatter, null, 2)}</code></pre>
        </div>
        <div class="mt-4">
          <h2 class="text-lg font-semibold">Detected Components</h2>
          <ul class="list-disc list-inside bg-gray-200 p-3 rounded mt-1 text-sm">
            ${components.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates a rich, diagnostic fallback HTML page when an Astro layout fails to parse or render.
 * This serves as the "visual debugging layer".
 *
 * @param {object} details - An object containing error information.
 * @param {string} details.filePath - The path of the file that failed.
 * @param {string[]} details.errors - A list of specific error messages.
 * @param {object} details.frontmatter - The parsed frontmatter, which may contain an error key.
 * @param {string[]} details.components - The list of components that were detected before the failure.
 * @returns {string} A complete HTML document as a string.
 */
export function generateFallbackHtml({ filePath, errors, frontmatter, components }) {
  const frontmatterString = JSON.stringify(frontmatter, null, 2);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Layout Preview Failed</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        .card {
          background-color: #ffffff;
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
      </style>
    </head>
    <body class="bg-gray-50 font-sans">
      <div class="container mx-auto p-4 md:p-8">

        <div class="card">
          <h1 class="text-2xl font-bold text-gray-800">Layout Preview Failed</h1>
          <p class="mt-2 text-gray-600">The layout at <code class="text-sm bg-gray-200 p-1 rounded">${filePath}</code> could not be rendered. Here's a summary of what we found.</p>
        </div>

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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Frontmatter</h2>
            <p class="text-xs text-gray-500 mt-1">This is the data extracted from the '---' block.</p>
            <div class="mt-3 bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
              <pre><code>${frontmatterString}</code></pre>
            </div>
          </div>

          <div class="card">
            <h2 class="text-xl font-semibold text-gray-800">Detected Components</h2>
             <p class="text-xs text-gray-500 mt-1">These components were found in the file body.</p>
            <div class="mt-3 space-y-2">
              ${components && components.length > 0
                ? components.map(c => `<div class="flex items-center space-x-3"><span class="tag tag-success">${c}</span></div>`).join('')
                : '<p class="text-sm text-gray-500">No components were detected before the error occurred.</p>'
              }
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}