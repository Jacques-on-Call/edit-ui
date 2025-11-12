import { useState } from 'preact/hooks';
import Icon from './Icon';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    console.log(`[SearchBar] Calling onSearch with query: "${newQuery}"`);
    onSearch(newQuery);
  };

  const handleKeyDown = (e) => {
    // Optional: Keep Enter key functionality for immediate search
    if (e.key === 'Enter') {
      onSearch(query);
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
        className="w-full bg-transparent text-white/80 placeholder-white/40 border-none rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent-lime/50"
      />
    </div>
  );
};

export default SearchBar;
