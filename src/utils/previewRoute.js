export function getPreviewBase() {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/+$/, '');
  return '/preview'; // default
}

// src/pages/foo/bar.(astro|md) => /preview/foo/bar
// index.(astro|md) maps to directory root: /preview/foo/
export function pathToPreviewRoute(filePath) {
  const base = getPreviewBase();
  if (!filePath?.startsWith('src/pages/')) return `${base}/`;
  let p = filePath.slice('src/pages/'.length);
  p = p.replace(/\.(astro|md)x?$/i, '');

  if (p === 'index') return `${base}/`;
  if (p.endsWith('/index')) {
    const dir = p.slice(0, -('/index'.length));
    return `${base}/${dir}`.replace(/\/+$/, '/') || `${base}/`;
  }
  // Ensure no double slashes, and leave off trailing slash for leaf pages
  return `${base}/${p}`.replace(/\/{2,}/g, '/');
}
