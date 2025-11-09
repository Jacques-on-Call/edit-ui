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
  const response = await fetch(url, {
    credentials: 'include', // Always include cookies (gh_session token)
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
  }

  return response.json();
}
