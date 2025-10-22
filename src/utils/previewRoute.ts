export function getPreviewBase(): string {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/+$/, '');
  return '/preview'; // default
}

// src/pages/foo/bar.(astro|md) => /preview/foo/bar
// index.(astro|md) maps to directory root: /preview/foo/
export function pathToPreviewRoute(filePath: string): string {
  const base = getPreviewBase();
  if (!filePath?.startsWith('src/pages/')) return base;
  let withoutPrefix = filePath.slice('src/pages/'.length);
  // strip extension
  withoutPrefix = withoutPrefix.replace(/\.(astro|md)x?$/i, '');
  // index → directory root
  if (withoutPrefix.endsWith('/index')) {
    return `${base}/${withoutPrefix.slice(0, -('/index'.length))}`.replace(/\/+$/, '/') || `${base}/`;
  }
  return `${base}/${withoutPrefix}`.replace(/\/+$/, '');
}
