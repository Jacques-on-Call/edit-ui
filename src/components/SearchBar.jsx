import { useState, useMemo, useEffect } from 'preact/hooks';
import { debounce } from 'lodash-es';
import Icon from './Icon';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery) => {
        try {
          console.log(`[SearchBar] Calling onSearch with query: "${searchQuery}"`);
          onSearch(searchQuery);
        } catch (err) {
          // avoid breaking events
          // eslint-disable-next-line no-console
          console.error('onSearch handler error:', err);
        }
      }, 300),
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debouncedSearch && debouncedSearch.cancel) debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleClear = () => {
    if (debouncedSearch && debouncedSearch.cancel) {
      debouncedSearch.cancel();
    }
    setQuery('');
    onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debouncedSearch && debouncedSearch.cancel) debouncedSearch.cancel();
      try {
        onSearch(query);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('onSearch immediate call error:', err);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Icon name="Search" className="text-white/40 w-5 h-5" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Find content or files..."
        className="w-full bg-transparent text-white/80 placeholder-white/40 border-none rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-accent-lime/50"
      />
      {query && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <button
            onClick={handleClear}
            className="text-white/40 hover:text-white focus:outline-none"
            aria-label="Clear search"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
