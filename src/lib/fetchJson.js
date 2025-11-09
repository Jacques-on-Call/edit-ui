/**
 * Centralized utility for making authenticated API requests.
 * Automatically includes credentials (cookies) with all requests to ensure
 * the gh_session token is sent to the backend.
 * 
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options (headers, method, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - If the response is not ok
 */
export async function fetchJson(url, options = {}) {
  const finalOptions = {
    credentials: 'include', // Always include cookies (gh_session token)
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    const errorText = await response.text();
    // Try to parse as JSON for a more structured error message
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      // Fallback to plain text if not JSON
      throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
    }
  }

  // Handle cases where the response might be empty
  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : {};
}
