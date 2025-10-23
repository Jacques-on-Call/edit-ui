export function getPreviewBase() {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/+$/, '');
  }
  return '/preview';
}

// src/pages/foo/bar.(astro|md|mdx) => /preview/foo/bar
// src/pages/index.(astro|md|mdx) => /preview/
// src/pages/blog/index.(astro|md|mdx) => /preview/blog/
export function pathToPreviewRoute(filePath) {
  const base = getPreviewBase();
  if (!filePath || !filePath.startsWith('src/pages/')) return `${base}/`;

  let p = filePath.slice('src/pages/'.length);
  p = p.replace(/\.(astro|mdx?|html)$/i, '');

  if (p === 'index') return `${base}/`;

  if (p.endsWith('/index')) {
    const dir = p.slice(0, -('/index'.length));
    const encodedDir = dir.split('/').map(encodeURIComponent).join('/');
    return `${base}/${encodedDir}`.replace(/\/+$/, '/') || `${base}/`;
  }

  const encoded = p.split('/').map(encodeURIComponent).join('/');
  return `${base}/${encoded}`.replace(/\/{2,}/g, '/');
}
