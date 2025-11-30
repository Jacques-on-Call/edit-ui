/**
 * Transforms a repository path to a GitHub raw URL for editor preview.
 * Repository paths like 'src/assets/images/...' need to be converted to
 * accessible URLs for the browser to display during editing.
 * 
 * @param {string} path - The image path (could be a repo path or already a URL)
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo')
 * @returns {string|null} A URL the browser can load, or null if path is falsy
 */
export function getPreviewImageUrl(path, repoFullName) {
  if (!path) return null;
  
  // If it's already a full URL (http/https), use it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a repository path (e.g., 'src/assets/images/...'), transform to GitHub raw URL
  if (path.startsWith('src/') && repoFullName) {
    return `https://raw.githubusercontent.com/${repoFullName}/main/${path}`;
  }
  
  // Fallback: return as-is (might be a relative URL like '/images/...')
  return path;
}
