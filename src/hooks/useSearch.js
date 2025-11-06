import { useState, useCallback } from 'preact/hooks';
import matter from 'gray-matter';

export function useSearch(repo, fileManifest) {
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
      const res = await fetch(`/api/files?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      const data = await res.json();
      const content = atob(data.content);
      setFileContentCache(prev => ({ ...prev, [file.sha]: content }));
      return content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      return '';
    }
  }, [repo, fileContentCache]);

  const performSearch = useCallback(async (query) => {
    if (!query || !fileManifest) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerCaseQuery = query.toLowerCase();
    const results = [];

    for (const file of fileManifest) {
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
  }, [fileManifest, fetchContent]);

  return { searchResults, performSearch, isSearching };
}
