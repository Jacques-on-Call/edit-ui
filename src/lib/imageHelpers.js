/**
 * Gets the deployed site URL for the user's repository.
 * Uses Cloudflare Pages naming convention.
 * 
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo')
 * @returns {string|null} The deployed site URL or null if not determinable
 */
export function getDeployedSiteUrl(repoFullName) {
  if (!repoFullName) return null;
  
  // Extract repo name from 'owner/repo' format
  const repoName = repoFullName.split('/')[1];
  if (!repoName) return null;
  
  // Cloudflare Pages convention: {repo-name}.pages.dev
  return `https://${repoName.toLowerCase()}.pages.dev`;
}

/**
 * Constructs a GitHub raw URL for a repository path.
 * 
 * @param {string} path - The repository path
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo')
 * @returns {string|null} The GitHub raw URL or null if not constructable
 */
export function getGitHubRawUrl(path, repoFullName) {
  if (!path || !repoFullName) return null;
  return `https://raw.githubusercontent.com/${repoFullName}/main/${path}`;
}

/**
 * Transforms a repository path to a URL for editor preview.
 * 
 * TWO-TIER STRATEGY:
 * 1. Primary: GitHub raw URL (works immediately after upload, even before deploy)
 * 2. Fallback: Stored in component's onError handler to try deployed site
 * 
 * CONTEXT: The editor runs in a browser. It cannot access local filesystem paths.
 * Images stored in the GitHub repo must be accessed via raw.githubusercontent.com
 * 
 * KEY INSIGHT: Images ARE deployed to Cloudflare Pages after Astro build. However,
 * Astro transforms images with hashes (e.g., /_astro/image.HASH.png), making the
 * exact URL unpredictable. GitHub raw URLs work immediately but have rate limits.
 * The fallback mechanism in the component handles both cases.
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
    const rawUrl = getGitHubRawUrl(path, repoFullName);
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
