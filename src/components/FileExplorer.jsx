import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import FileTile from './FileTile';
import CreateModal from './CreateModal';
import ContextMenu from './ContextMenu';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';
import ReadmeDisplay from './ReadmeDisplay';
import AssignLayoutModal from './AssignLayoutModal';
import * as cache from '../utils/cache';
import { routeForPath } from '../utils/editorRouting';

function FileExplorer({ repo }) {
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);
  const [fileToAssignLayout, setFileToAssignLayout] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);
  const navigate = useNavigate();

  const handleNewLayout = () => {
    navigate('/layouts');
  };

  const fetchMetadata = useCallback(async (file) => {
    if (file.type === 'dir') return;
    try {
      const res = await fetch(`/api/metadata?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
      const metadata = await res.json();
      if (metadata && metadata.author) {
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
        cache.set(file.sha, metadata);
      }
    } catch (err) {
      console.error(`Failed to fetch metadata for ${file.path}:`, err);
    }
  }, [repo]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setMetadataCache({});
    setReadmeContent(null);
    setReadmeLoading(false);

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
      setFiles(sortedData);

      // Fetch README content
      const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        setReadmeLoading(true);
        try {
          const readmeRes = await fetch(`/api/file?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' });
          if (!readmeRes.ok) throw new Error('Could not fetch README content.');
          const readmeData = await readmeRes.json();
          // The content from GitHub API is base64 encoded.
          // Use TextDecoder for robust UTF-8 decoding.
          const binaryString = atob(readmeData.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const decodedContent = new TextDecoder('utf-8').decode(bytes);
          setReadmeContent(decodedContent);
        } catch (readmeErr) {
          console.error("Failed to fetch or decode README:", readmeErr);
          // Non-critical error, so we don't set the main error state
          setReadmeContent('Could not load README.');
        } finally {
          setReadmeLoading(false);
        }
      }

      // Fetch metadata for each file
      sortedData.forEach(file => {
        const cachedData = cache.get(file.sha);
        if (cachedData) {
          setMetadataCache(prev => ({ ...prev, [file.sha]: cachedData }));
        } else {
          fetchMetadata(file);
        }
      });

    } catch (err) {
      console.error("Error fetching files:", err);
      setError(`Failed to load repository contents. Please check your connection and repository permissions. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [repo, path, fetchMetadata]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileClick = (file) => {
    if (selectedFile && selectedFile.sha === file.sha) {
      handleOpen(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleFileDoubleClick = (file) => {
    // Double-click/double-tap always opens the file directly
    handleOpen(file);
  };

  const handleOpen = (fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;

    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      const { pathname, search } = routeForPath(file.path);
      navigate(`${pathname}${search}`);
    }
  };

  const handleGoHome = () => setPath('src/pages');

  const handleDuplicate = async (file) => {
    handleCloseContextMenu();
    const parts = file.name.split('.');
    const extension = parts.pop();
    const baseName = parts.join('.');
    const newName = `${baseName}-copy.${extension}`;
    const newPath = file.path.replace(file.name, newName);

    try {
      const response = await fetch('/api/duplicate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: file.path, newPath }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to duplicate file.');
      }
      fetchFiles(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  const handleLongPress = (file, coords) => setContextMenu({ x: coords.clientX, y: coords.clientY, file });
  const handleCloseContextMenu = () => setContextMenu(null);
  const handleDeleteRequest = (file) => {
    setFileToDelete(file);
    handleCloseContextMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      let response;
      if (fileToDelete.type === 'dir') {
        response = await fetch('/api/delete-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ repo, path: fileToDelete.path }),
        });
      } else {
        response = await fetch('/api/files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ repo, path: fileToDelete.path, sha: fileToDelete.sha }),
        });
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete.');
      }
      setFileToDelete(null);
      fetchFiles(); // Refresh file list
      cache.remove(fileToDelete.sha);
    } catch (err) {
      console.error(err);
      // Here you might want to show an error message to the user
    }
  };

  const handleAssignLayoutRequest = (file) => {
    setFileToAssignLayout(file);
    handleCloseContextMenu();
  };

  const handleAssignLayoutConfirm = async (layoutIdentifier) => {
    if (!fileToAssignLayout) return;
    try {
      const response = await fetch('/api/assign-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: fileToAssignLayout.path,
          layout: layoutIdentifier,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to assign layout.');
      }
      console.log('Layout assigned successfully!');
      fetchFiles(); // Refresh to show any potential changes
    } catch (err) {
      console.error(err);
      // Optionally show an error message to the user
    } finally {
      setFileToAssignLayout(null);
    }
  };

  const handleRenameRequest = (file) => {
    setFileToRename(file);
    handleCloseContextMenu();
  };

  const handleToggleReadme = () => setReadmeVisible(prev => !prev);

  const handleRenameConfirm = async (file, newName) => {
    if (!file || !newName || newName === file.name) {
      setFileToRename(null);
      return;
    }
    const oldPath = file.path;
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;

    try {
      const response = await fetch('/api/rename-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, oldPath, newPath, sha: file.sha }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to rename file.');
      }
      setFileToRename(null);
      fetchFiles(); // Refresh file list
      cache.remove(file.sha);
    } catch (err) {
      console.error(err);
      // Here you might want to show an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 text-gray-500 animate-pulse">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="container max-w-2xl mx-auto mt-12 p-8 border-2 border-red-200 bg-red-50 rounded-lg text-center shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">An Error Occurred</h2>
          <p className="text-red-600 mb-6 break-words">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={fetchFiles}
              className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
            <Link to="/repository-selection" className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Change Repository
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAtRoot = path === 'src/pages';
  const getCurrentFolderName = () => isAtRoot ? 'Home' : path.split('/').pop();

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.isArray(files) && files.filter(file => !file.name.startsWith('_') && file.name.toLowerCase() !== 'readme.md').map(file => (
            <FileTile
              key={file.sha}
              file={file}
              isSelected={selectedFile && selectedFile.sha === file.sha}
              metadata={metadataCache[file.sha]}
              onClick={handleFileClick}
              onDoubleClick={handleFileDoubleClick}
              onLongPress={(file, coords) => handleLongPress(file, coords)}
              onRename={() => handleRenameRequest(file)}
              onDelete={() => handleDeleteRequest(file)}
            />
          ))}
        </div>
        {isReadmeLoading && <div className="text-center text-gray-500 my-8">Loading README...</div>}
        {readmeContent && !isReadmeLoading && (
          <ReadmeDisplay
            content={readmeContent}
            isVisible={isReadmeVisible}
            onToggle={handleToggleReadme}
          />
        )}
      </main>
      <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 flex justify-between items-center p-2 z-10">
        <div className="flex-1 flex justify-start">
            <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-200"
                onClick={handleNewLayout}
                title="Manage Layouts"
            >
                <Icon name="layout-editor" className="h-6 w-6" />
                <span className="font-semibold hidden sm:inline">Layouts</span>
            </button>
        </div>
        <div className="flex-1 flex justify-center">
            <button
                className="bg-bark-blue text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-105"
                onClick={() => setCreateModalOpen(true)}
                title="Create a new file or folder"
            >
                <Icon name="plus" />
            </button>
        </div>
        <div className="flex-1 flex justify-end">
            <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGoHome}
                disabled={isAtRoot}
            >
                <Icon name="home" />
                <span className="font-semibold">{getCurrentFolderName()}</span>
            </button>
        </div>
      </footer>
      {isCreateModalOpen && <CreateModal path={path} repo={repo} onClose={() => setCreateModalOpen(false)} onCreate={fetchFiles} />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={handleCloseContextMenu} onRename={handleRenameRequest} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} onAssignLayout={handleAssignLayoutRequest} />}
      {fileToDelete && <ConfirmDialog message={`Are you sure you want to delete "${fileToDelete.name}"?`} onConfirm={handleDeleteConfirm} onCancel={() => setFileToDelete(null)} />}
      {fileToRename && <RenameModal file={fileToRename} onClose={() => setFileToRename(null)} onRename={handleRenameConfirm} />}
      {fileToAssignLayout && <AssignLayoutModal onClose={() => setFileToAssignLayout(null)} onAssign={handleAssignLayoutConfirm} currentPath={fileToAssignLayout.path} />}
    </div>
  );
}

export default FileExplorer;
