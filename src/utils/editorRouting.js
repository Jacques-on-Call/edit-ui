export function routeForPath(filePath) {
  if (!filePath) return { pathname: '/explorer' };
  const isPages = filePath.startsWith('src/pages/');
  const isLayouts = filePath.startsWith('src/layouts/');
  const lower = filePath.toLowerCase();
  const isMd = lower.endsWith('.md') || lower.endsWith('.mdx');
  const isAstro = lower.endsWith('.astro');
  if (isPages && (isMd || isAstro)) {
    return { pathname: '/editor', search: `?path=${encodeURIComponent(filePath)}` };
  }
  if (isLayouts && isAstro) {
    return { pathname: '/visual-editor', search: `?path=${encodeURIComponent(filePath)}` };
  }
  return { pathname: '/editor', search: `?path=${encodeURIComponent(filePath)}` };
}
