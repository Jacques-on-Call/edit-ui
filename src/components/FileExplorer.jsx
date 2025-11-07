import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import CreateModal from './CreateModal';
import SearchResult from './SearchResult';
import { useSearch } from '../hooks/useSearch';
import { useFileManifest } from '../hooks/useFileManifest';
import { fetchJson } from '/src/lib/fetchJson.js';
import './LiquidGlassButton.css';

function FileExplorer({ repo, searchQuery }) {
  const { fileManifest } = useFileManifest(repo);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { searchResults, performSearch, isSearching } = useSearch(repo, fileManifest);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const fetchDetailsForFile = useCallback(async (file) => {
    if (file.type === 'dir') return;
    try {
      // Use the new, dedicated endpoint for fetching decoded and parsed file content
      const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`;
      const fileData = await fetchJson(url);

      if (!fileData || typeof fileData.frontmatter !== 'object') {
        console.error('Unexpected file detail response', fileData);
        setMetadataCache(prev => ({ ...prev, [file.sha]: { error: 'Missing or invalid frontmatter' } }));
        return;
      }

      // Fetch commit data separately
      const commitData = await fetchJson(`/api/file/commits?repo=${repo}&path=${file.path}`);
      const lastCommit = commitData[0];

      const metadata = {
        ...fileData.frontmatter,
        lastEditor: lastCommit?.commit?.author?.name,
        lastModified: lastCommit?.commit?.author?.date,
      };

      if (metadata) {
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
      }
    } catch (err) {
      console.error(`Failed to fetch details for ${file.path}:`, err.message);
      setMetadataCache(prev => ({ ...prev, [file.sha]: { error: err.message } }));
    }
  }, [repo]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data = await fetchJson(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' });

      const sortedData = data.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sortedData);

      sortedData.forEach(file => {
        fetchDetailsForFile(file);
      });

      const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        setReadmeLoading(true);
        try {
          const readmeData = await fetchJson(`/api/files?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' });
          const decodedContent = atob(readmeData.content);
          setReadmeContent(decodedContent);
        } catch (readmeErr) {
          console.error("Failed to fetch or decode README:", readmeErr);
          setReadmeContent('Could not load README.');
        } finally {
          setReadmeLoading(false);
        }
      }

    } catch (err) {
      console.error("Error fetching files:", err);
      setError(`Failed to load repository contents. Please check your connection and repository permissions. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [repo, path, fetchDetailsForFile]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const showSearchResults = searchQuery.trim().length > 0;

  const handleFileClick = (file) => {
    if (selectedFile && selectedFile.sha === file.sha) {
      handleOpen(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleFileDoubleClick = (file) => {
    handleOpen(file);
  };

  const handleCreate = async (name, type) => {
    try {
      const fullPath = `${path}/${name}`;
      let body = { repo, path: fullPath, type };

      // For files, add some default, base64 encoded content
      if (type === 'file') {
        try {
            const templateUrl = `/api/files?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent('src/pages/_template.astro')}`;
            const templateData = await fetchJson(templateUrl, { credentials: 'include' });
            const content = atob(templateData.content);
            body.content = btoa(content);
        } catch (err) {
            console.error('Template fetch error:', err);
            setError(err.message || String(err));
            return;
        }
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      fetchFiles(); // Refresh the file list
      setCreateModalOpen(false); // Close the modal
    } catch (err) {
      console.error('Create error:', err);
      setError(`Failed to create item: ${err.message}`);
    }
  };


  const handleDelete = async (file) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        await fetchJson(`/api/files?repo=${repo}&path=${file.path}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        fetchFiles();
      } catch (err) {
        setError(`Failed to delete file: ${err.message}`);
      }
    }
  };

  const handleOpen = (fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;

    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      console.log(`Navigating to editor for: ${file.path}`);
    }
  };

  const handleGoHome = () => setPath('src/pages');

  const handleToggleReadme = () => setReadmeVisible(prev => !prev);

  const [filteredFiles, setFilteredFiles] = useState([]);

  useEffect(() => {
    const baseFiltered = files.filter(file => file.type === 'dir' || file.name.endsWith('.astro'));

    if (!searchQuery || !searchQuery.trim()) {
      setFilteredFiles(baseFiltered);
      return;
    }

    const q = searchQuery.toLowerCase();
    const searchFiltered = baseFiltered.filter((f) => {
      const name = (f.name || '').toLowerCase();
      const path = (f.path || '').toLowerCase();
      return name.includes(q) || path.includes(q);
    });

    setFilteredFiles(searchFiltered);
  }, [files, searchQuery]);

  const filesToDisplay = filteredFiles;

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-center p-8 text-gray-500 animate-pulse">Loading files...</div></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="container max-w-2xl mx-auto mt-12 p-8 border-2 border-red-200 bg-red-50 rounded-lg text-center shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">An Error Occurred</h2>
          <p className="text-red-600 mb-6 break-words">{error}</p>
          <button onClick={fetchFiles} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-white">
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
        path={path}
        repo={repo}
      />
      <main className="flex-grow overflow-y-auto pb-24">
        {showSearchResults ? (
          <div className="p-4">
            <h2 class="text-xl font-bold mb-4">Search Results</h2>
            {isSearching ? (
              <div className="text-center p-8 text-gray-500 animate-pulse">Searching...</div>
            ) : (
              searchResults.map(file => (
                <SearchResult
                  key={file.sha}
                  file={file}
                  searchQuery={searchQuery}
                  onSelect={handleOpen}
                />
              ))
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {Array.isArray(filesToDisplay) && filesToDisplay.filter(file => !file.name.startsWith('.') && file.name.toLowerCase() !== 'readme.md').map(file => (
                <FileTile
                  key={file.sha}
                  file={file}
                  metadata={metadataCache[file.sha]}
                  isSelected={selectedFile && selectedFile.sha === file.sha}
                  onClick={handleFileClick}
                  onDoubleClick={handleFileDoubleClick}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {isReadmeLoading && <div className="text-center text-gray-400 my-8">Loading README...</div>}
            {readmeContent && !isReadmeLoading && (
              <div className="w-full">
                 <div className="bg-black/20 p-4 sm:p-6 rounded-lg border border-white/10">
                    <ReadmeDisplay
                      content={readmeContent}
                      isVisible={isReadmeVisible}
                      onToggle={handleToggleReadme}
                    />
                 </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-3 z-20">
        <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl shadow-lg flex justify-around items-center p-2 border border-white/20">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40"
            onClick={handleGoHome}
            disabled={path === 'src/pages'}
            title="Go to root directory"
          >
            <Icon name="Home" className="w-5 h-5" />
            <span className="font-semibold text-sm">Home</span>
          </button>
          <div className="flex-shrink-0 mx-2 sm:mx-4">
            <div
              onClick={() => setCreateModalOpen(true)}
              className="button w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px]"
              title="Create a new file or folder"
            >
              <div className="base"></div>
              <div className="light-pool"></div>
              <div className="body"></div>
              <div className="surface"></div>
              <div className="icon text-[28px] sm:text-[32px] md:text-[36px]">+</div>
            </div>
          </div>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
            title="Back to repository selection"
            onClick={() => route('/repo-select')}
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
            <span className="font-semibold text-sm">Back</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default FileExplorer;
