import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import './search-bar.css';

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
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for files..."
        className="search-input"
      />
      {query && (
        <div className="search-results">
          {loading && <div className="search-result-item">Loading...</div>}
          {error && <div className="search-result-item error">{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className="search-result-item">No results found.</div>
          )}
          {results.map((result) => (
            <div
              key={result.sha}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <span className="result-name">{result.name}</span>
              <span className="result-path">{result.path}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
