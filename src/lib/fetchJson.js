export async function fetchJson(url, options = {}) {
  const finalOptions = {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, finalOptions);

  // Get response text first
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[fetchJson] HTTP ${response.status} for ${url}`);
    console.error(`[fetchJson] Response body:`, responseText);

    // Try to parse error as JSON
    try {
      const errorJson = JSON.parse(responseText);
      throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      throw new Error(responseText || `HTTP error! status: ${response.status}`);
    }
  }

  // Parse successful response
  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    console.error(`[fetchJson] Failed to parse JSON from ${url}`);
    console.error(`[fetchJson] Response text:`, responseText);
    throw new Error(`Invalid JSON response: ${parseError.message}`);
  }
}
