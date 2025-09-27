import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import styles from './search-bar.module.css';

const SearchBar = ({ repo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?repo=${repo}&query=${searchQuery}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }
      const data = await res.json();
      // The backend returns an array directly, not an object with an 'items' property.
      setResults(data || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  const debouncedSearch = useMemo(() => debounce(performSearch, 300), [performSearch]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleResultClick = (result) => {
    // For now, we can just log it. A real implementation would navigate
    // to the file or open it. This depends on the main app's navigation logic.
    console.log('Navigating to:', result.path);
    // This is where you would typically use `navigate` from `react-router-dom`
    // For example: navigate(`/explorer/file?path=${result.path}`);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for files..."
        className={styles.searchInput}
      />
      {query && (
        <div className={styles.searchResults}>
          {loading && <div className={styles.searchResultItem}>Loading...</div>}
          {error && <div className={`${styles.searchResultItem} ${styles.error}`}>{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className={styles.searchResultItem}>No results found.</div>
          )}
          {results.map((result) => (
            <div
              key={result.sha}
              className={styles.searchResultItem}
              onClick={() => handleResultClick(result)}
            >
              <span className={styles.resultName}>{result.name}</span>
              <span className={styles.resultPath}>{result.path}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
