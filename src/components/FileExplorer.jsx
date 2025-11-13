import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}
import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import matter from 'gray-matter';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import CreateModal from './CreateModal';
import { FileContextMenu } from './FileContextMenu';
import { MoveModal } from './MoveModal';
import { SearchResultItem } from './SearchResultItem';
import { useSearch } from '../hooks/useSearch';
import { useFileManifest } from '../hooks/useFileManifest';
import { fetchJson } from '/src/lib/fetchJson.js';
import './LiquidGlassButton.css';

function FileExplorer({ repo, searchQuery, onShowCreate, onPathChange, refreshTrigger }) {
  console.log(`[FileExplorer.jsx] searchQuery prop: "${searchQuery}"`);
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
const [contextMenu, setContextMenu] = useState(null);
const [moveFile, setMoveFile] = useState(null);
const { searchResults, performSearch, isSearching } = useSearch(repo, fileManifest);

// Notify parent of path changes
useEffect(() => {
if (onPathChange) {
onPathChange(path);
}
}, [path, onPathChange]);

const handleLongPress = (file, event) => {
event.preventDefault();
const x = event.touches ? event.touches[0].pageX : event.pageX;
const y = event.touches ? event.touches[0].pageY : event.pageY;
setContextMenu({ x, y, file });
};

const handleCloseContextMenu = useCallback(() => {
setContextMenu(null);
}, []);

const handleContextMenuAction = (action, file) => {
  switch (action) {
    case 'delete':
      handleDelete(file);
      break;
    case 'duplicate':
      handleDuplicate(file);
      break;
    case 'move':
      setMoveFile(file);
      break;
    default:
      console.warn(`Unknown context menu action: ${action}`);
  }
};

const handleDuplicate = async (file) => {
  try {
    const body = {
      repo: repo,
      path: file.path,
    };

    const newFile = await fetchJson('/api/files/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Add the new file to the UI
    setFiles(prevFiles => [...prevFiles, newFile.content]);

  } catch (err) {
    console.error('Failed to duplicate file:', err);
    setError(`Failed to duplicate ${file.name}: ${err.message}.`);
  }
};

useEffect(() => {
performSearch(searchQuery);
}, [searchQuery, performSearch]);

const RELEVANT_EXTENSIONS = ['.md', '.mdx', '.astro'];

const fetchDetailsForFile = useCallback(async (file) => {
    if (file.type === 'dir') return;

    let metadata = {};
    try {
      // First, try to get commit data for all file types
      try {
        const commitData = await fetchJson(`/api/file/commits?repo=${repo}&path=${file.path}`);
        const lastCommit = commitData[0];
        if (lastCommit) {
          metadata.lastEditor = lastCommit.commit?.author?.name;
          metadata.lastModified = lastCommit.commit?.author?.date;
        }
      } catch (commitErr) {
        console.warn(`Could not fetch commits for ${file.path}:`, commitErr);
      }

      // Then, only attempt to parse content for relevant file types
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      if (RELEVANT_EXTENSIONS.includes(fileExtension)) {
        const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`;
        const response = await fetchJson(url);

        if (response && typeof response.content === 'string') {
          try {
            const decodedContent = atob(response.content);
            const { data: frontmatter } = matter(decodedContent);
            metadata = { ...metadata, ...frontmatter };
          } catch (e) {
            console.error(`Error decoding or parsing frontmatter for ${file.path}:`, e);
            metadata.error = 'Invalid content';
          }
        } else {
          metadata.error = 'Missing or invalid content';
        }
      }

      setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));

    } catch (err) {
      // This is the global catch block for the entire process
      console.error(`CRITICAL: An unexpected error occurred while processing ${file.path}:`, err);
      metadata.error = 'Processing failed';
      setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
    }
  }, [repo]);

const fetchFiles = useCallback(async () => {
setLoading(true);
setError(null);

try {
let data = await fetchJson(`/api/files?repo=${repo}&path=${path}`);

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
const readmeData = await fetchJson(`/api/files?repo=${repo}&path=${readmeFile.path}`);
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

// Refresh files when refreshTrigger changes
useEffect(() => {
if (refreshTrigger > 0) {
fetchFiles();
}
}, [refreshTrigger, fetchFiles]);

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


const handleDelete = async (file) => {
  if (confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) {
    try {
      const body = {
        repo: repo,
        path: file.path,
        sha: file.sha, // Required for deleting files
      };

      await fetchJson('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Optimistically remove the file from the UI
      setFiles(prevFiles => prevFiles.filter(f => f.sha !== file.sha));

      // Optionally, show a success notification here

    } catch (err) {
      console.error(`Failed to delete ${file.type}:`, err);
      setError(`Failed to delete ${file.name}: ${err.message}. Please refresh and try again.`);
      // Optionally, show an error notification here
    }
  }
};

const handleMove = async (file, destinationPath) => {
  const newPath = `${destinationPath}/${file.name}`;
  try {
    const body = {
      repo: repo,
      path: file.path,
      newPath: newPath,
      sha: file.sha,
    };

    await fetchJson('/api/files/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setFiles(prevFiles => prevFiles.filter(f => f.sha !== file.sha));
    setMoveFile(null);

  } catch (err) {
    console.error(`Failed to move file:`, err);
    setError(`Failed to move ${file.name}: ${err.message}.`);
    setMoveFile(null); // Close modal on error
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

const filesToDisplay = showSearchResults ? searchResults : files;

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
    <div className="flex flex-col h-full" onClick={handleCloseContextMenu}>
      <main className="flex-grow overflow-y-auto p-4 pb-24">
        {showSearchResults ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Search Results</h2>
            {isSearching ? (
              <p>Searching...</p>
            ) : (
              <div>
                {searchResults.map(result => (
                  <SearchResultItem key={result.path} result={result} query={searchQuery} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.isArray(filesToDisplay) && filesToDisplay
                .filter(file => !file.name.startsWith('.') && file.name.toLowerCase() !== 'readme.md')
                .map(file => (
                  <FileTile
                    key={file.sha}
                    file={file}
                    metadata={metadataCache[file.sha]}
                    isSelected={selectedFile && selectedFile.sha === file.sha}
                    onOpen={handleOpen}
                    onShowActions={handleLongPress}
                  />
                ))}
            </div>
            {contextMenu && (
              <FileContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                file={contextMenu.file}
                onClose={handleCloseContextMenu}
                onAction={handleContextMenuAction}
              />
            )}
            {isReadmeLoading && <div className="text-center text-gray-400 my-8">Loading README...</div>}
            {readmeContent && !isReadmeLoading && (
              <div className="w-full max-w-screen-md mx-auto mt-8">
                <div className="bg-black/20 p-2 sm:p-6 rounded-lg border border-white/10">
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
      {moveFile && (
        <MoveModal
          file={moveFile}
          repo={repo}
          onClose={() => setMoveFile(null)}
          onMove={handleMove}
        />
      )}
</div>
);
}

export default FileExplorer;
