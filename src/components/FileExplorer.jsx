
import { useEffect } from 'preact/hooks';
import { useSearch } from '../hooks/useSearch';
import SearchResult from './SearchResult';
import FileTile from './FileTile';

// Mock data to replace the useFileManifest hook
const mockFileManifest = [
  { path: 'src/pages/index.astro', name: 'index.astro', sha: 'a' },
  { path: 'src/pages/about.md', name: 'about.md', sha: 'b' },
  { path: 'src/components/Header.jsx', name: 'Header.jsx', sha: 'c' },
  { path: 'README.md', name: 'README.md', sha: 'd' },
  { path: 'src/pages/lets-go.md', name: 'lets-go.md', sha: 'e' },
];

const mockFiles = [
  { sha: '1', type: 'dir', name: 'folder1' },
  { sha: '2', type: 'file', name: 'file1.md' },
];

function FileExplorer({ repo, searchQuery }) {
  console.log(`[FileExplorer.jsx] searchQuery prop: "${searchQuery}"`);

  // We are isolating useSearch. We provide it a mock manifest.
  const { searchResults, performSearch, isSearching } = useSearch(repo, mockFileManifest);

  // This effect will run when the search query prop changes, triggering the search
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const showSearchResults = searchQuery && searchQuery.trim().length > 0;

  return (
    <div>
      <h1>File Explorer (useSearch Test)</h1>
      <p>Current search query: {searchQuery}</p>

      {showSearchResults ? (
        <div>
          <h2 className="text-xl font-bold p-4">Search Results</h2>
          {isSearching ? (
            <p className="p-4">Searching...</p>
          ) : (
            searchResults.map(file => (
              <SearchResult
                key={file.sha}
                file={file}
                searchQuery={searchQuery}
                onSelect={() => {}} // No-op
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {mockFiles.map(file => (
            <FileTile
              key={file.sha}
              file={file}
              metadata={null}
              isSelected={false}
              onOpen={() => {}}
              onShowActions={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FileExplorer;
