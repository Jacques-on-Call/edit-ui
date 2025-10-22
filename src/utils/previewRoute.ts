export function getPreviewBase(): string {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/+$/, '');
  return '/preview';
}

// src/pages/foo/bar.(astro|md) => /preview/foo/bar
// index.(astro|md) => directory route: /preview/foo/
export function pathToPreviewRoute(filePath: string): string {
  const base = getPreviewBase();
  if (!filePath?.startsWith('src/pages/')) return `${base}/`;
  let p = filePath.slice('src/pages/'.length);
  p = p.replace(/\.(astro|md)x?$/i, '');

  if (p === 'index' || p === '') return `${base}/`;
  if (p.endsWith('/index')) {
    const dir = p.slice(0, -'index'.length);
    return `${base}/${dir}`.replace(/\/+$/, ''); // Ends in slash
  }
  // Ensure no double slashes, and leave off trailing slash for leaf pages
  return `${base}/${p}`.replace(/\/{2,}/g, '/');
}
