import { useState, useMemo } from 'preact/compat';
import { debounce } from 'lodash-es';
import Icon from './Icon';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery) => {
        onSearch(searchQuery);
      }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
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
    </div>
  );
};

export default SearchBar;
