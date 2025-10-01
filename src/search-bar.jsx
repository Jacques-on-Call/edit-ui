import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

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

  const searchResultItemBase = "p-3 cursor-pointer border-b border-gray-100";

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for files..."
        className="w-full py-2 px-1 text-base bg-transparent text-dark-grey outline-none border-b-2 border-transparent transition-colors placeholder:text-gray-400 focus:border-blue-500"
      />
      {query && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-md shadow-lg mt-2 max-h-72 overflow-y-auto z-50">
          {loading && <div className={searchResultItemBase}>Loading...</div>}
          {error && <div className={`${searchResultItemBase} text-red-600`}>{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className={searchResultItemBase}>No results found.</div>
          )}
          {results.map((result) => (
            <div
              key={result.sha}
              className={`${searchResultItemBase} hover:bg-gray-100 last:border-b-0`}
              onClick={() => handleResultClick(result)}
            >
              <span className="font-medium text-gray-900">{result.name}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{result.path}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
