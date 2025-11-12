import { useState, useCallback, useRef } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

async function fetchAllFiles(repo) {
  try {
    const allFiles = await fetchJson(`/api/files/all?repo=${encodeURIComponent(repo)}`);
    return allFiles.filter(file => file.path.startsWith('src/pages/') && file.type === 'file');
  } catch (error) {
    console.error('Failed to fetch file manifest:', error);
    return [];
  }
}

async function fetchAndProcessFile(file, query, repo) {
  try {
    const fileContentResponse = await fetchJson(`/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`);
    const fileContent = atob(fileContentResponse.content);
    const lines = fileContent.split('\n');
    const snippets = [];
    const queryLower = query.toLowerCase();

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(queryLower)) {
        snippets.push({
          lineNumber: index + 1,
          line: line.trim(),
        });
      }
    });

    if (snippets.length > 0) {
      return {
        path: file.path,
        name: file.name,
        matchCount: snippets.length,
        snippets: snippets,
      };
    }
  } catch (error) {
    console.warn(`Could not process file ${file.path}:`, error);
  }
  return null;
}

export function useSearch(repo) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileListCache = useRef(null);
  const searchTimeout = useRef(null);

  const performSearch = useCallback((query) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeout.current = setTimeout(async () => {
      if (!fileListCache.current) {
        fileListCache.current = await fetchAllFiles(repo);
      }

      const searchPromises = fileListCache.current
        .map(file => fetchAndProcessFile(file, query, repo));

      const results = (await Promise.all(searchPromises)).filter(Boolean);
      setSearchResults(results);
      setIsSearching(false);
    }, 300); // Debounce search
  }, [repo]);

  return { searchResults, performSearch, isSearching };
}
