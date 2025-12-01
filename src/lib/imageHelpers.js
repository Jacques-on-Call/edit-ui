/**
 * Transforms a repository path to a GitHub raw URL for editor preview.
 * Repository paths like 'src/assets/images/...' or 'content/...' need to be converted to
 * accessible URLs for the browser to display during editing.
 * 
 * CONTEXT: The editor runs in a browser. It cannot access local filesystem paths.
 * Images stored in the GitHub repo must be accessed via raw.githubusercontent.com
 * 
 * @param {string} path - The image path (could be a repo path or already a URL)
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo')
 * @returns {string|null} A URL the browser can load, or null if path is falsy
 */
export function getPreviewImageUrl(path, repoFullName) {
  console.log('[getPreviewImageUrl] Input path:', path);
  console.log('[getPreviewImageUrl] repoFullName:', repoFullName);
  
  if (!path) {
    console.log('[getPreviewImageUrl] No path provided');
    return null;
  }
  
  // If it's already a full URL (http/https), use it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('[getPreviewImageUrl] Already a URL, using directly');
    return path;
  }
  
  // If it's a repository path (e.g., 'src/assets/images/...' or 'content/...' or 'public/...'), transform to GitHub raw URL
  if ((path.startsWith('src/') || path.startsWith('content/') || path.startsWith('public/')) && repoFullName) {
    const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/main/${path}`;
    console.log('[getPreviewImageUrl] Constructed GitHub raw URL:', rawUrl);
    return rawUrl;
  }
  
  // If we have a repo path but no repoFullName, log a warning
  if (path.startsWith('src/') || path.startsWith('content/') || path.startsWith('public/')) {
    console.error('[getPreviewImageUrl] Cannot construct URL: repoFullName is missing');
    console.error('[getPreviewImageUrl] Path needs repoFullName:', path);
    return null;
  }
  
  // Fallback: return as-is (might be a relative URL like '/images/...')
  console.log('[getPreviewImageUrl] Unknown format, returning as-is:', path);
  return path;
}
