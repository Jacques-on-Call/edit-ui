export async function ensureUniqueAstroPath(repo: string, desiredPath: string) {
  const slash = desiredPath.lastIndexOf('/');
  const dir = desiredPath.slice(0, slash);
  const file = desiredPath.slice(slash + 1);
  const base = file.replace(/\.astro$/i, '');
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? `${base}.astro` : `${base}-${i + 1}.astro`;
    const candidatePath = `${dir}/${candidate}`;
    const res = await fetch(
      `/api/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(candidatePath)}`,
      { credentials: 'include' }
    );
    if (res.status === 404) return candidatePath;
  }
  return desiredPath;
}
