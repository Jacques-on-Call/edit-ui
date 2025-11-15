// Mock API for Sprint1 (defensive, never throws - always returns {ok:, ...})
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

/**
 * saveDraft(payload)
 * - Always resolves to { ok: boolean, key?: string, error?: string }
 * - Catches localStorage errors and returns them as structured result (no throws).
 */
export async function saveDraft({ slug = 'home', content = '', meta = {} } = {}) {
  console.log('[mockApi] saveDraft called', slug, 'payload length', (content || '').length);
  try {
    const key = `easy-seo:draft:${slug}`;
    // localStorage may throw in private mode/locked environments - catch it
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), payload: { slug, content, meta } }));
    } catch (storageErr) {
      console.error('[mockApi] localStorage.setItem failed:', storageErr && storageErr.message ? storageErr.message : storageErr);
      return { ok: false, error: `localStorage error: ${storageErr && storageErr.message ? storageErr.message : String(storageErr)}` };
    }
    // simulate latency
    await new Promise(res => setTimeout(res, 260));
    console.log('[mockApi] saveDraft resolved, key=', key);
    return { ok: true, key };
  } catch (err) {
    console.error('[mockApi] unexpected saveDraft error:', err);
    return { ok: false, error: String(err) };
  }
}
