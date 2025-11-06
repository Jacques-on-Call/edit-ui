// https://github.com/Jacques-on-Call/StrategyContent/blob/main/easy-seo/src/components/SearchBar.jsx
import { useState, useMemo, useEffect } from 'preact/hooks';
import { debounce } from 'lodash-es';
import Icon from './Icon';

const SearchBar = ({ onSearch }) => {
const [query, setQuery] = useState('');

// create one debounced function and ensure cleanup on unmount
const debouncedSearch = useMemo(
() =>
debounce((searchQuery) => {
try {
onSearch(searchQuery);
} catch (err) {
// swallow to avoid uncaught exceptions breaking future events
// but log so developer can see the problem
// eslint-disable-next-line no-console
console.error('onSearch handler error:', err);
}
}, 300),
[onSearch]
);

useEffect(() => {
return () => {
// cancel pending debounced calls when component unmounts
debouncedSearch.cancel && debouncedSearch.cancel();
};
}, [debouncedSearch]);

const handleChange = (e) => {
const newQuery = e.target.value;
setQuery(newQuery);
debouncedSearch(newQuery);
};

const handleKeyDown = (e) => {
// immediate search on Enter (flush debounce) for expected UX
if (e.key === 'Enter') {
// flush pending debounced call and call instantly
debouncedSearch.cancel && debouncedSearch.cancel();
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
