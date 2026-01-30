import { useState, useEffect, useCallback } from 'preact/hooks';
import { fetchJson } from '/src/lib/fetchJson.js';

export function useFileManifest(repo) {
  const [fileManifest, setFileManifest] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFileManifest = useCallback(async () => {
    if (!repo) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson(`/api/files?repo=${repo}`);
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
