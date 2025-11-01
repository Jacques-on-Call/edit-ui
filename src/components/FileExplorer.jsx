import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import Icon from './Icon';
import FileTile from './FileTile';
import CreateModal from './CreateModal';
import ContextMenu from './ContextMenu';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';

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
      setFiles(sortedData);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(`Failed to load repository contents. Please check your connection and repository permissions. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [repo, path]);

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
    handleOpen(file);
  };

  const handleOpen = (fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;

    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      // For now, just log the file path. Routing will be handled later.
      console.log(`Navigating to editor for: ${file.path}`);
    }
  };

  const handleGoHome = () => setPath('src/pages');

  const handleLongPress = (file, coords) => setContextMenu({ x: coords.clientX, y: coords.clientY, file });
  const handleCloseContextMenu = () => setContextMenu(null);
  const handleDeleteRequest = (file) => {
    setFileToDelete(file);
    handleCloseContextMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fileToDelete.path, sha: fileToDelete.sha }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete file.');
      }
      setFileToDelete(null);
      fetchFiles(); // Refresh file list
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleRenameRequest = (file) => {
    setFileToRename(file);
    handleCloseContextMenu();
  };

  const handleRenameConfirm = async (file, newName) => {
    if (!file || !newName || newName === file.name) {
      setFileToRename(null);
      return;
    }
    const oldPath = file.path;
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;

    try {
      // 1. Get the content of the old file
      const fileContentResponse = await fetch(`/api/files?repo=${repo}&path=${oldPath}`, { credentials: 'include' });
      if (!fileContentResponse.ok) {
        throw new Error('Could not fetch file content to rename.');
      }
      const fileData = await fileContentResponse.json();
      const decodedContent = atob(fileData.content);

      // 2. Create the new file
      const createResponse = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: newPath,
          content: decodedContent,
          message: `feat: rename ${oldPath} to ${newPath}`,
        }),
      });
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create new file for rename.');
      }

      // 3. Delete the old file
      const deleteResponse = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: oldPath, sha: file.sha }),
      });
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.message || 'Failed to delete old file after rename.');
      }

      setFileToRename(null);
      fetchFiles(); // Refresh file list
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

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
    <div className="relative min-h-[calc(100vh-250px)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
        {Array.isArray(files) && files.filter(file => !file.name.startsWith('.')).map(file => (
          <FileTile
            key={file.sha}
            file={file}
            isSelected={selectedFile && selectedFile.sha === file.sha}
            onClick={handleFileClick}
            onDoubleClick={handleFileDoubleClick}
            onLongPress={handleLongPress}
          />
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 flex justify-between items-center p-2 z-10">
        <div className="flex-1 flex justify-start"></div>
        <div className="flex-1 flex justify-center">
            <button
                className="bg-primary text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:bg-opacity-90"
                onClick={() => setCreateModalOpen(true)}
                title="Create a new file or folder"
            >
                <Icon name="Plus" />
            </button>
        </div>
        <div className="flex-1 flex justify-end">
            <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                onClick={handleGoHome}
                disabled={path === 'src/pages'}
            >
                <Icon name="Home" />
                <span className="font-semibold">Home</span>
            </button>
        </div>
      </div>
      {isCreateModalOpen && <CreateModal path={path} repo={repo} onClose={() => setCreateModalOpen(false)} onCreate={fetchFiles} />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={handleCloseContextMenu} onRename={handleRenameRequest} onDelete={handleDeleteRequest} />}
      {fileToDelete && <ConfirmDialog message={`Are you sure you want to delete "${fileToDelete.name}"?`} onConfirm={handleDeleteConfirm} onCancel={() => setFileToDelete(null)} />}
      {fileToRename && <RenameModal file={fileToRename} onClose={() => setFileToRename(null)} onRename={handleRenameConfirm} />}
    </div>
  );
}

export default FileExplorer;
