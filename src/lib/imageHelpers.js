/**
 * Constructs a URL for an image.
 * If the path is already a full URL, it's returned directly.
 * Otherwise, it constructs a URL to proxy the image through the application's backend.
 * This ensures that the user's authentication token is used to fetch images
 * from private GitHub repositories, solving CORS and authentication issues.
 *
 * @param {string} path - The repository path to the image (e.g., 'src/assets/images/image.png') or a full URL.
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo'). Required for repository paths.
 * @returns {string|null} The final image URL (either direct or proxied), or null if essential parameters are missing.
 */
export function getPreviewImageUrl(path, repoFullName) {
  if (!path) {
    return null;
  }

  // If it's already a full URL, use it directly.
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a repository path, a repo full name is required to build the proxy URL.
  if (!repoFullName) {
    console.error('[getPreviewImageUrl] Cannot construct proxy URL: repoFullName is missing for path:', path);
    return null;
  }

  // Construct the proxy URL, ensuring components are properly encoded.
  return `/api/proxy-image?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(path)}`;
}

/**
 * Constructs a GitHub raw URL for an image.
 * This is used as a fallback when the proxy endpoint fails.
 * Note: This will only work for public repositories or if the user has
 * already authenticated with GitHub in the same browser session.
 *
 * @param {string} path - The repository path to the image.
 * @param {string} repoFullName - The full repo name (e.g., 'owner/repo').
 * @param {string} branch - The branch name (default: 'main').
 * @returns {string|null} The GitHub raw URL, or null if essential parameters are missing.
 */
export function getGitHubRawUrl(path, repoFullName, branch = 'main') {
  if (!path || !repoFullName) {
    return null;
  }

  // If it's already a full URL, use it directly.
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `https://raw.githubusercontent.com/${repoFullName}/${branch}/${path}`;
}
