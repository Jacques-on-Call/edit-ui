import { useState, useCallback, useRef } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

async function fetchAllFiles(repo) {
  try {
    const allFiles = await fetchJson(`/api/files/all?repo=${encodeURIComponent(repo)}`);

    if (!Array.isArray(allFiles)) {
      console.error('[useSearch] API response is not an array. Received:', allFiles);
      return [];
    }

    return allFiles.filter(file => file && file.path && file.path.startsWith('src/pages/') && file.type === 'file');
  } catch (error) {
    console.error('Failed to fetch file manifest:', error);
    return [];
  }
}

import matter from 'gray-matter';

const RELEVANT_EXTENSIONS = ['.md', '.mdx', '.astro'];

async function fetchAndProcessFile(file, query, repo) {
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  if (!RELEVANT_EXTENSIONS.includes(fileExtension)) {
    return null; // Skip files that aren't text-based content
  }

  try {
    const fileContentResponse = await fetchJson(`/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`);
    if (!fileContentResponse || !fileContentResponse.content) {
      console.warn(`No content for ${file.path}`);
      return null;
    }

    const decodedContent = atob(fileContentResponse.content);
    const { content: body } = matter(decodedContent); // Parse frontmatter and get only the body

    const lines = body.split('\n');
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
