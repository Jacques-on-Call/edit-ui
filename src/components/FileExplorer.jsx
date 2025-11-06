import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import CreateModal from './CreateModal';
import SearchResult from './SearchResult';
import matter from 'gray-matter';
import { useSearch } from '../hooks/useSearch';
import LiquidGlassButton from './LiquidGlassButton';

function FileExplorer({ repo, searchQuery }) {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [fileManifest, setFileManifest] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { searchResults, performSearch, isSearching } = useSearch(repo);

  useEffect(() => {
    performSearch(searchQuery, fileManifest);
  }, [searchQuery, performSearch, fileManifest]);

  useEffect(() => {
    async function getFileManifest() {
      try {
        const res = await fetch(`/api/files/all?repo=${repo}`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`Failed to fetch file manifest: ${res.statusText}`);
        }
        const data = await res.json();
        setFileManifest(data);
      } catch (err) {
        console.error("Error fetching file manifest:", err);
        setError(`Failed to load file manifest. Search may be unavailable. Details: ${err.message}`);
      }
    }
    if (repo) {
      getFileManifest();
    }
  }, [repo]);

  const fetchDetailsForFile = useCallback(async (file) => {
    if (file.type === 'dir') return;
    try {
      // Fetch frontmatter and content
      const fileRes = await fetch(`/api/files?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!fileRes.ok) throw new Error(`Failed to fetch file content: ${fileRes.statusText}`);
      const fileData = await fileRes.json();
      const decodedContent = atob(fileData.content);
      const { data } = matter(decodedContent);

      // Fetch commit data
      const commitRes = await fetch(`/api/file/commits?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!commitRes.ok) throw new Error(`Failed to fetch commit data: ${commitRes.statusText}`);
      const commitData = await commitRes.json();
      const lastCommit = Array.isArray(commitData) ? commitData[0] : undefined;

      const metadata = {
        ...data,
        lastEditor: lastCommit?.commit?.author?.name,
        lastModified: lastCommit?.commit?.author?.date,
      };

      if (metadata) {
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
      }
    } catch (err) {
      console.error(`Failed to fetch details for ${file.path}:`, err);
    }
  }, [repo]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
      }
      let data = await response.json();

      const sortedData = data.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      setCurrentFiles(sortedData);

      sortedData.forEach(file => {
        fetchDetailsForFile(file);
      });

      const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        setReadmeLoading(true);
        try {
          const readmeRes = await fetch(`/api/files?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' });
          if (!readmeRes.ok) throw new Error('Could not fetch README content.');
          const readmeData = await readmeRes.json();
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
        const defaultContent = `---
title: "New Page"
description: "A fresh new page."
---

# Welcome to your new page!
`;
        body.content = btoa(defaultContent);
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchFiles(); // Refresh the file list
        setCreateModalOpen(false); // Close the modal
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError(`Failed to create item: ${err.message}`);
    }
  };


  const handleDelete = async (file) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        const response = await fetch(`/api/files?repo=${repo}&path=${file.path}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          fetchFiles();
        } else {
          const errorText = await response.text();
          setError(`Failed to delete file: ${errorText}`);
        }
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

  const filesToDisplay = currentFiles
    .filter(file => file.type === 'dir' || file.name.endsWith('.astro'));

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
         <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl shadow-lg flex justify-between items-center p-2 border border-white/20">
            <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40"
                onClick={handleGoHome}
                disabled={path === 'src/pages'}
                title="Go to root directory"
            >
                <Icon name="Home" className="w-5 h-5" />
                <span className="font-semibold text-sm">Home</span>
            </button>
            <LiquidGlassButton onClick={() => setCreateModalOpen(true)} />
            <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
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
