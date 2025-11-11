// easy-seo/src/hooks/useSearch.js
import { useState, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

export function useSearch(repo) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (query) => {
    console.log('[useSearch] Query:', query);
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await fetchJson(`/api/search?q=${encodeURIComponent(query)}&repo=${encodeURIComponent(repo)}`);
      console.log('[useSearch] Results:', results.length);
      setSearchResults(results);
    } catch (error) {
      console.error('Server-side search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [repo]);

  return { searchResults, performSearch, isSearching };
}
