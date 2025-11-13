import { useState, useCallback, useRef } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

export function useSearch(repo) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const performSearch = useCallback((query) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await fetchJson(`/api/search?repo=${encodeURIComponent(repo)}&query=${encodeURIComponent(query)}`);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Failed to fetch search results:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search
  }, [repo]);

  return { searchResults, performSearch, isSearching };
}
