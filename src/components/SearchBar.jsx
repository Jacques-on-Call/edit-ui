import { useState, useMemo, useEffect } from 'preact/hooks';
import { debounce } from 'lodash-es';
import Icon from './Icon';

/**
* Robust SearchBar:
* - Debounced search (300ms)
* - Cancels pending debounce on unmount
* - Flushes search instantly on Enter
* - Logs errors from onSearch to avoid silent failures
*/
const SearchBar = ({ onSearch }) => {
const [query, setQuery] = useState('');

const debouncedSearch = useMemo(
() =>
debounce((searchQuery) => {
try {
onSearch(searchQuery);
} catch (err) {
// Prevent uncaught exceptions from breaking future events
// eslint-disable-next-line no-console
console.error('onSearch handler error:', err);
}
}, 300),
[onSearch]
);

useEffect(() => {
return () => {
// Cancel pending debounced calls when component unmounts
if (debouncedSearch && debouncedSearch.cancel) debouncedSearch.cancel();
};
}, [debouncedSearch]);

const handleChange = (e) => {
const newQuery = e.target.value;
setQuery(newQuery);
debouncedSearch(newQuery);
};

const handleKeyDown = (e) => {
if (e.key === 'Enter') {
// flush and call immediately for expected UX
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
className="w-full bg-transparent text-white/80 placeholder-white/40 border-none rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent-lime/50"
/>
</div>
);
};

export default SearchBar;
