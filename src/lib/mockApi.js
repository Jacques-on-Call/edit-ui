import { fetchJson } from './fetchJson';

// Defensive mock API - includes saveDraft and publishPage
export async function fetchPageJson(path) {
  console.log('[mockApi] fetchPageJson called for path:', path);
  try {
    const repoData = JSON.parse(localStorage.getItem('easy-seo-repo'));
    if (!repoData || !repoData.repo) {
      throw new Error('No repository selected in localStorage');
    }
    const repo = repoData.repo;

    // Call the correct endpoint with the required 'repo' and 'path' parameters
    const data = await fetchJson(`/api/get-file-content?repo=${repo}&path=${path}`);

    // The content is base64 encoded, so we need to decode it.
    const decodedContent = atob(data.content);

    // Strip YAML frontmatter to isolate the HTML content for the editor.
    const stripFrontmatter = (text) => {
      const lines = text.split('\n');
      if (lines[0].trim() !== '---') {
        return text; // No frontmatter found
      }
      const secondFenceIndex = lines.indexOf('---', 1);
      if (secondFenceIndex === -1) {
        return text; // Malformed frontmatter, return as is
      }
      return lines.slice(secondFenceIndex + 1).join('\n').trim();
    };

    const contentBody = stripFrontmatter(decodedContent);
    const slug = path.split('/').pop().replace(/\.[^/.]+$/, '');

    return {
      meta: { title: slug }, // Placeholder for now
      content: contentBody,
    };
  } catch (error) {
    const slug = path.split('/').pop().replace(/\.[^/.]+$/, '');
    console.error(`[mockApi] Error fetching page JSON for path "${path}":`, error);
    // Return a default structure on error to prevent crashes
    return {
      meta: { title: `Error loading ${slug}`, slug },
      content: `<p>Could not load content for ${path}.</p>`,
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
