// Defensive mock API - includes saveDraft and publishPage
export function fetchPageJson(slug = 'home') {
  console.log('[mockApi] fetchPageJson called for', slug);
  const fixture = {
    meta: { title: 'Mock Title for ' + slug, slug, initialContent: '<p>Welcome to mock ' + slug + '</p>' },
    blocks: [
      { id: 'block-1', type: 'heading', content: 'Main Heading' },
      { id: 'block-2', type: 'paragraph', content: 'A paragraph of text.' },
    ]
  };
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[mockApi] returning fixture for', slug);
      resolve(fixture);
    }, 120);
  });
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
