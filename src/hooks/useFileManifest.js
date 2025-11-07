import { useState, useEffect, useCallback } from 'preact/hooks';

export function useFileManifest(repo) {
  const [fileManifest, setFileManifest] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFileManifest = useCallback(async () => {
    if (!repo) return;

    setIsLoading(true);
    setError(null);

    try {
      const repoParam = encodeURIComponent(repo);
      const url = `/api/files?repo=${repoParam}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch file manifest');
      }
      const data = await response.json();
      setFileManifest(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchFileManifest();
  }, [fetchFileManifest]);

  return { fileManifest, isLoading, error };
}
