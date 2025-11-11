// easy-seo/src/hooks/useSearch.js
import { useState, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

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
      // Use new endpoint that returns decoded content
      const data = await fetchJson(`/api/get-file-content?repo=${repo}&path=${file.path}`);
      const content = data.content; // Already decoded by worker
      setFileContentCache(prev => ({ ...prev, [file.sha]: content }));
      return content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      return '';
    }
  }, [repo, fileContentCache]);

  const performSearch = useCallback(async (query) => {
    console.log('[useSearch] Query:', query);
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Only search through actual files, not directories
    const searchableFiles = (files || []).filter(f => f.type === 'file');
    console.log('[useSearch] Files to search:', searchableFiles?.length);

    for (const file of searchableFiles) {
      try {
        // Search in filename first
        if (file.name.toLowerCase().includes(lowerQuery)) {
          results.push({ ...file, matchType: 'filename' });
          continue;
        }

        // Then search in content
        const content = await fetchContent(file);
        if (content.toLowerCase().includes(lowerQuery)) {
          results.push({ ...file, matchType: 'content' });
        }
      } catch (error) {
        console.error(`Search error for ${file.path}:`, error);
      }
    }
    console.log('[useSearch] Results:', results.length);
    setSearchResults(results);
    setIsSearching(false);
  }, [files, fetchContent]);

  return { searchResults, performSearch, isSearching };
}
