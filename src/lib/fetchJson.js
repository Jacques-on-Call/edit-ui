// Robust client-side fetch helper for debugging and stable production use
export async function fetchJson(url, opts = {}) {
  const options = { credentials: 'include', ...opts };
  const res = await fetch(url, options);
  const text = await res.text();

  // Log details for debugging
  if (!res.ok) {
    console.error(`[fetchJson] ${url} -> status ${res.status}`, text);
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || `Request failed with status ${res.status}`);
    } catch {
      throw new Error(`Request failed: ${res.status} - ${text ? text.slice(0, 500) : '<empty response>'}`);
    }
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`[fetchJson] invalid JSON from ${url}`, text);
    throw new Error('Invalid JSON returned from server');
  }
}
