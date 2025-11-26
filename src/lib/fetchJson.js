class HTTPError extends Error {
  constructor(response) {
    super(`HTTP error! status: ${response.status}`);
    this.name = 'HTTPError';
    this.response = response;
    this.status = response.status;
  }
}

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

  if (!response.ok) {
    const error = new HTTPError(response);
    try {
      // Try to get detailed error message from response body
      error.data = await response.json();
    } catch (e) {
      // If body is not json, fall back to text
      try {
        error.data = await response.text();
      } catch (textError) {
        error.data = 'Could not read error response body.';
      }
    }
    console.error(`[fetchJson] An HTTP error occurred:`, {
      url: url,
      status: error.status,
      responseData: error.data,
    });
    throw error;
  }

  try {
    const text = await response.text();
    // Handle empty responses from APIs that return 204 No Content
    return text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error(`[fetchJson] Failed to parse successful JSON response from ${url}`);
    // Throw a new error to avoid exposing the raw response text in production
    throw new Error('Invalid JSON response from server.');
  }
}
