import { fetchJson } from './fetchJson';

// Defensive mock API - includes saveDraft and publishPage
export async function fetchPageJson(slug = 'home') {
  console.log('[mockApi] fetchPageJson called for', slug);
  try {
    // This is the new, real implementation
    const data = await fetchJson(`/api/files/get/${slug}`);
    // The backend returns the file content in a `content` property
    // and metadata in a `meta` property. We need to format this
    // into the structure the frontend expects.
    return {
      meta: data.meta || { title: 'Error: No meta found' },
      content: data.content || '',
    };
  } catch (error) {
    console.error(`[mockApi] Error fetching page JSON for slug "${slug}":`, error);
    // Return a default structure on error to prevent crashes
    return {
      meta: { title: `Error loading ${slug}`, slug },
      content: `<p>Could not load content for ${slug}.</p>`,
    };
  }
}

export async function saveDraft({ slug = 'home', content = '', meta = {} } = {}) {
  console.log('[mockApi] saveDraft called', slug, 'payload length', (content || '').length);
  try {
    const key = `easy-seo:draft:${slug}`;
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), payload: { slug, content, meta } }));
    } catch (storageErr) {
      console.error('[mockApi] localStorage.setItem failed:', storageErr && storageErr.message ? storageErr.message : storageErr);
      return { ok: false, error: `localStorage error: ${storageErr && storageErr.message ? storageErr.message : String(storageErr)}` };
    }
    await new Promise(res => setTimeout(res, 260));
    console.log('[mockApi] saveDraft resolved, key=', key);
    return { ok: true, key };
  } catch (err) {
    console.error('[mockApi] unexpected saveDraft error:', err);
    return { ok: false, error: String(err) };
  }
}

/**
 * publishPage - mock publish stored in localStorage
 */
export async function publishPage({ slug = 'home', content = '', meta = {} } = {}) {
  console.log('[mockApi] publishPage called for', slug, 'payload length', (content || '').length);
  try {
    const key = `easy-seo:published:${slug}`;
    const payload = { publishedAt: Date.now(), slug, content, meta };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (storageErr) {
      console.error('[mockApi] localStorage.setItem failed (publish):', storageErr && storageErr.message ? storageErr.message : storageErr);
      return { ok: false, error: `localStorage error: ${storageErr && storageErr.message ? storageErr.message : String(storageErr)}` };
    }
    await new Promise((res) => setTimeout(res, 350));
    const url = `/preview/mock-preview.html?published=${encodeURIComponent(slug)}&ts=${Date.now()}`;
    console.log('[mockApi] publishPage resolved, url=', url);
    return { ok: true, key, url };
  } catch (err) {
    console.error('[mockApi] unexpected publishPage error:', err);
    return { ok: false, error: String(err) };
  }
}
