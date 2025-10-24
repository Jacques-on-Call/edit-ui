import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon'; // Import the Icon component

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
    setQuery('');
    setResults([]);
    navigate(`/explorer/file?path=${result.path}`);
  };

  const highlightSnippet = (snippet, query) => {
    if (!snippet) return '';
    const regex = new RegExp(`(${query})`, 'gi');
    return snippet.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon name="Search" className="text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="...find your content or file"
        className="w-full pl-10 pr-4 py-2 text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0"
      />
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-gray-500">Loading...</div>}
          {error && <div className="px-4 py-3 text-red-600">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-3 text-gray-500">No results found.</div>
          )}
          {results.map((result) => (
            <div
              key={result.sha}
              className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              onClick={() => handleResultClick(result)}
            >
              <p className="font-semibold text-gray-800">{result.display_name || result.name}</p>
              <p
                className="text-sm text-gray-500"
                dangerouslySetInnerHTML={{ __html: highlightSnippet(result.snippet, query) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;