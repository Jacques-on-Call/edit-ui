import { useState, useCallback } from 'preact/hooks';
import matter from 'gray-matter';
import { fetchJson } from '/src/lib/fetchJson.js';

export function useSearch(repo, files) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fileContentCache, setFileContentCache] = useState({});

  const fetchContent = useCallback(async (file) => {
    if (fileContentCache[file.sha]) {
      return fileContentCache[file.sha];
    }
    if (file.type === 'dir') {
      return '';
    }
    try {
      const data = await fetchJson(`/api/files?repo=${repo}&path=${file.path}`);
      const content = atob(data.content);
      setFileContentCache(prev => ({ ...prev, [file.sha]: content }));
      return content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      return '';
    }
  }, [repo, fileContentCache]);

  const performSearch = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerCaseQuery = query.toLowerCase();
    const results = [];

    for (const file of files) {
      const content = await fetchContent(file);
      const fileNameMatch = file.name.toLowerCase().includes(lowerCaseQuery);
      const contentMatch = content.toLowerCase().includes(lowerCaseQuery);

      if (fileNameMatch || contentMatch) {
        results.push({
          ...file,
          content: content,
        });
      }
    }

    setSearchResults(results);
    setIsSearching(false);
  }, [files, fetchContent]);

  return { searchResults, performSearch, isSearching };
}
