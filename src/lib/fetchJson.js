export async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  if (!res.ok) {
    let parsed;
    try { parsed = JSON.parse(txt); } catch { parsed = null; }
    console.error('fetchJson error', url, res.status, txt);
    throw new Error(parsed?.message || `Request failed: ${res.status}`);
  }
  try {
    return JSON.parse(txt);
  } catch (err) {
    console.error('fetchJson invalid JSON', url, txt);
    throw new Error('Invalid JSON from server');
  }
}
