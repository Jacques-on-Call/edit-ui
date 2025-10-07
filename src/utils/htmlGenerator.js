/**
 * Replaces relative asset paths (like /images/foo.png) with absolute URLs
 * pointing to the raw assets in the GitHub repository. This is crucial
 * for ensuring images and other assets load correctly within the sandboxed
 * iframe preview.
 *
 * @param {string} htmlContent The HTML string to process.
 * @param {string} repoFullName The full repository name in 'owner/repo' format.
 * @param {string} branch The branch name, defaulting to 'main'.
 * @returns {string} The processed HTML with absolute asset URLs.
 */
function resolveAssetPaths(htmlContent, repoFullName, branch = 'main') {
  if (!htmlContent || !repoFullName) {
    return htmlContent;
  }

  // Base URL for raw content, assuming assets are in the 'public' directory at the repo root.
  const baseUrl = `https://raw.githubusercontent.com/${repoFullName}/${branch}/public`;

  // Regex to find all `src` attributes with relative paths (starting with "/")
  // and rewrite them to the absolute GitHub URL.
  return htmlContent.replace(/src="\/([^"]+)"/g, (match, relativePath) => {
    // Simple guard to avoid re-rewriting absolute URLs
    if (relativePath.startsWith('http')) {
      return match;
    }
    return `src="${baseUrl}/${relativePath}"`;
  });
}

/**
 * Generates a complete, self-contained HTML document string for previewing.
 *
 * @param {object} frontmatter The page's frontmatter, used for the <title>.
 * @param {string} bodyHtml The HTML content of the page body from the editor.
 * @param {string} repoFullName The full repository name (e.g., 'owner/repo').
 * @returns {string} A complete HTML document as a string.
 */
export function generatePreviewHtml(frontmatter, bodyHtml, repoFullName) {
  const title = frontmatter.title || 'Preview';

  // Ensure asset paths in the body content are absolute before injection.
  const resolvedBodyHtml = resolveAssetPaths(bodyHtml, repoFullName);

  // We use the Tailwind CDN script to provide styling within the iframe.
  // This is a simple and effective way to get high-fidelity styling without
  // needing to inject a full, compiled CSS file.
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-white">
      ${resolvedBodyHtml}
    </body>
    </html>
  `;
}