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
import ContextMenu from './ContextMenu';
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

useEffect(() => {
performSearch(searchQuery);
}, [searchQuery, performSearch]);

const fetchDetailsForFile = useCallback(async (file) => {
    if (file.type === 'dir') return;

    try {
      const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`;
      const response = await fetchJson(url);

      if (!response || typeof response.content !== 'string') {
        console.error('Unexpected file detail response', response);
        setMetadataCache(prev => ({ ...prev, [file.sha]: { error: 'Missing or invalid content' } }));
        return;
      }

      let decodedContent;
      try {
        decodedContent = atob(response.content);
      } catch (e) {
        console.warn(`Could not decode content for ${file.path}. It may be a binary file. Skipping frontmatter parsing.`);
        return;
      }

      let frontmatter, body;
      try {
        ({ data: frontmatter, content: body } = matter(decodedContent));
      } catch (e) {
        console.error(`Error parsing frontmatter for ${file.path}:`, e);
        setMetadataCache(prev => ({ ...prev, [file.sha]: { error: 'Failed to parse content' } }));
        return;
      }

      // Fetch commit data separately
      const commitData = await fetchJson(`/api/file/commits?repo=${repo}&path=${file.path}`);
      const lastCommit = commitData[0];

      const metadata = {
        ...frontmatter,
        lastEditor: lastCommit?.commit?.author?.name,
        lastModified: lastCommit?.commit?.author?.date,
      };

      if (metadata) {
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
      }
    } catch (err) {
      console.error(`Failed to fetch details for ${file.path}:`, err);
      setMetadataCache(prev => ({ ...prev, [file.sha]: { error: err.message } }));
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
if (confirm(`Are you sure you want to delete ${file.name}?`)) {
try {
await fetchJson(`/api/files?repo=${repo}&path=${file.path}`, {
method: 'DELETE',
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
        {showSearchResults && (
          <h2 className="text-xl font-bold mb-4">Search Results</h2>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isSearching ? (
            <p>Searching...</p>
          ) : (
            Array.isArray(filesToDisplay) && filesToDisplay
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
              ))
          )}
        </div>

        {!showSearchResults && (
          <>
{contextMenu && (
<ContextMenu
x={contextMenu.x}
y={contextMenu.y}
options={[
{
label: 'Open',
action: () => handleOpen(contextMenu.file)
},
{
label: 'Delete',
action: () => handleDelete(contextMenu.file)
}
]}
onClose={handleCloseContextMenu}
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
</div>
);
}

export default FileExplorer;
