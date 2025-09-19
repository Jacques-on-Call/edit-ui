import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './icons.jsx';
import './search-styles.css';

// A simple debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

function SearchBar({ repo }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300); // 300ms delay
  const navigate = useNavigate();
  const searchContainerRef = useRef(null);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/search?repo=${repo}&query=${debouncedQuery}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, repo]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleResultClick = (result) => {
    navigate(`/explorer/file?path=${result.path}`);
    setQuery(''); // Clear search after navigation
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showResults = isFocused && (query.length > 0);

  return (
    <div className="search-container" ref={searchContainerRef}>
      <div className="search-input-wrapper">
        <Icon name="search" className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {query.length > 0 && (
          <button onClick={handleClear} className="clear-button" aria-label="Clear search">
            &times;
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results">
          {loading && <div className="search-loading">Searching...</div>}
          {!loading && results.length === 0 && debouncedQuery && (
            <div className="search-no-results">No results found.</div>
          )}
          {!loading && results.length > 0 && (
            <ul>
              {results.map((result) => (
                <li key={result.path} onClick={() => handleResultClick(result)}>
                  <div className="search-result-item">
                    <span className="search-result-name">{result.name}</span>
                    <span className="search-result-path">{result.path}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
