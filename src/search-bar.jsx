import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash-es';

const SearchBar = ({ repo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    navigate(`/explorer/file?path=${result.path}`);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for files..."
        className="w-full py-3 px-4 text-base border-none rounded-lg bg-gray-100 outline-none placeholder-gray-500"
      />
      {query && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg mt-2 max-h-72 overflow-y-auto z-[100]">
          {loading && <div className="p-3">Loading...</div>}
          {error && <div className="p-3 text-red-500">{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className="p-3">No results found.</div>
          )}
          {results.map((result) => (
            <div
              key={result.sha}
              className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              onClick={() => handleResultClick(result)}
            >
              <span className="font-medium text-gray-800">{result.name}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{result.path}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;