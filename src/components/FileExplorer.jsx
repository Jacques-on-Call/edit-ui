import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import CreateModal from './CreateModal';
import ContextMenu from './ContextMenu';
import SearchResult from './SearchResult';
import { useSearch } from '../hooks/useSearch';
import { useFileManifest } from '../hooks/useFileManifest';
import { fetchJson } from '/src/lib/fetchJson.js';
import './LiquidGlassButton.css';

function FileExplorer({ repo, searchQuery, onShowCreate, onPathChange, refreshTrigger }) {
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

const filesToDisplay = searchQuery ? searchResults : files;

if (loading) {
return <div className="text-center p-8">Loading files...</div>;

}

if (error) {
return (
<div className="p-4 m-4 bg-red-900/50 border border-red-700 rounded-lg text-white">
<h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
<p className="text-sm">{error}</p>
</div>
);
}

return (
<div className="flex flex-col h-full" onClick={handleCloseContextMenu}>
<main className="flex-1 overflow-y-auto p-4">
{showSearchResults ? (
<div>
<h2 className="text-xl font-bold mb-4">Search Results</h2>
{isSearching ? (
<p>Searching...</p>
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
<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
{Array.isArray(filesToDisplay) && filesToDisplay.filter(file => !file.name.startsWith('.') && file.name.toLowerCase() !== 'readme.md').map(file => (
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
{isReadmeLoading && <p className="mt-4">Loading README...</p>}

{readmeContent && !isReadmeLoading && (
<div className="mt-8">
<ReadmeDisplay
content={readmeContent}
isVisible={isReadmeVisible}
onToggle={handleToggleReadme}
/>
</div>
)}
</>
)}
</main>
<footer className="flex-shrink-0 bg-black/30 backdrop-blur-sm border-t border-white/10 flex items-center justify-around p-2">
<button
className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 px-2 sm:px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40"
onClick={handleGoHome}
disabled={path === 'src/pages'}
title="Go to root directory"
>
<Icon name="Home" className="w-5 h-5" />
<span className="text-xs sm:text-sm">Home</span>
</button>
<button
className="liquid-btn"
aria-label="Create"
onClick={(e) => { e.stopPropagation(); onShowCreate(); }}
title="Create a new file or folder"
>
<Icon name="Plus" className="w-6 h-6" />
</button>
<button
className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 px-2 sm:px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
title="Back to repository selection"
onClick={() => route('/repo-select')}
>
<Icon name="ArrowLeft" className="w-5 h-5" />
<span className="text-xs sm:text-sm">Back</span>
</button>
</footer>
</div>
);
}

export default FileExplorer;
