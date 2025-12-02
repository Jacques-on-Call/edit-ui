/**
 * Gets the deployed site URL for the user's repository.
 * Uses the hardcoded Cloudflare Pages URL for StrategyContent.
 * 
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo')
 * @returns {string|null} The deployed site URL or null if not determinable
 */
export function getDeployedSiteUrl(repoFullName) {
  if (!repoFullName) return null;
  
  // Hardcoded for the StrategyContent project
  return 'https://strategycontent.pages.dev';
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
 * Constructs a deployed site URL for an image path.
 * Images in src/assets/ are transformed by Astro and served from /_astro/
 * 
 * LIMITATION: Astro may add content hashes to filenames (e.g., image.abc123.png).
 * This function tries the original filename first. If it fails, the component's
 * onError handler will fall back to the GitHub raw URL which always works.
 * 
 * @param {string} path - The repository path (e.g., 'src/assets/images/home-from-json/image.png')
 * @param {string} repoFullName - The full repo name
 * @returns {string|null} The deployed site URL for the image
 */
export function getDeployedImageUrl(path, repoFullName) {
  if (!path || !repoFullName) return null;
  
  const baseUrl = getDeployedSiteUrl(repoFullName);
  if (!baseUrl) return null;
  
  // For images in src/assets/, Astro puts them in /_astro/
  // The filename is preserved but may have a hash added (e.g., image.abc123.png)
  // We try the original filename - if Astro hashed it, the fallback will be used
  const filename = path.split('/').pop();
  if (filename) {
    // Try the direct /_astro/ path with the original filename
    return `${baseUrl}/_astro/${filename}`;
  }
  
  return null;
}

/**
 * Transforms a repository path to a URL for editor preview.
 * 
 * STRATEGY:
 * 1. Primary: Deployed site URL (/_astro/filename) - works after deploy
 * 2. Fallback: GitHub raw URL (works immediately after upload) - handled by onError in components
 * 
 * CONTEXT: The editor runs in a browser. It cannot access local filesystem paths.
 * Images stored in the GitHub repo are deployed to Cloudflare Pages via Astro build.
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
  
  // If it's a repository path (e.g., 'src/assets/images/...' or 'content/...' or 'public/...'), 
  // try the deployed site URL first
  if ((path.startsWith('src/') || path.startsWith('content/') || path.startsWith('public/')) && repoFullName) {
    // Try deployed site URL first (preferred after deploy)
    const deployedUrl = getDeployedImageUrl(path, repoFullName);
    if (deployedUrl) {
      console.log('[getPreviewImageUrl] Constructed deployed site URL:', deployedUrl);
      return deployedUrl;
    }
    
    // Fallback to GitHub raw URL
    const rawUrl = getGitHubRawUrl(path, repoFullName);
    console.log('[getPreviewImageUrl] Fallback to GitHub raw URL:', rawUrl);
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
