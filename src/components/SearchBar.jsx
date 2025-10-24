import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import yaml from 'js-yaml';

const SearchBar = ({ repo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const parseFrontmatter = (content) => {
    try {
      const file = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .parse(content);
      const yamlNode = file.children.find(child => child.type === 'yaml');
      if (yamlNode) {
        return yaml.load(yamlNode.value);
      }
    } catch (e) {
      console.error("Frontmatter parsing error:", e);
    }
    return {};
  };

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
    navigate(`/editor?path=${result.path}`);
  };

  const highlight = (text) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon name="search" className="text-gray-400" />
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
          {results.map((result) => {
            const frontmatter = parseFrontmatter((result.fragments || []).join('\n'));
            const displayName = frontmatter.title || result.name;

            return (
              <div
                key={result.path}
                className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => handleResultClick(result)}
              >
                <p className="font-semibold text-gray-800">{highlight(displayName)}</p>
                {result.fragments && result.fragments.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    ...{highlight(result.fragments[0])}...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;