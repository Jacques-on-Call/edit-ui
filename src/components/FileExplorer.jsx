import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import FileTile from './FileTile';
import CreateModal from './CreateModal';
import AssignTemplateModal from './AssignTemplateModal';
import ContextMenu from './ContextMenu';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';
import ReadmeDisplay from './ReadmeDisplay';
import * as cache from '../utils/cache';

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
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);
  const [fileToAssignLayout, setFileToAssignLayout] = useState(null);
  const navigate = useNavigate();

  const handleNewLayout = () => {
    navigate('/layouts');
  };

  const handleAssignLayoutRequest = (file) => {
    setFileToAssignLayout(file);
  };

  const handleAssignLayoutConfirm = async (file, templateId) => {
    try {
      const response = await fetch(`/api/pages/${file.path}/assign-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
        body: JSON.stringify({ template_id: templateId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to assign layout. Status: ${response.status}`);
      }
      console.log(`Successfully assigned layout to ${file.name}`);
      setFileToAssignLayout(null);
    } catch (error) {
      console.error('Assign layout error:', error.message);
    }
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

  const fetchFiles = useCallback(() => {
    setLoading(true);
    setSelectedFile(null);
    setMetadataCache({});
    setReadmeContent(null);
    setReadmeLoading(false);

    fetch(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch files');
      })
      .then(data => {
        const sortedData = data.sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(sortedData);
        setLoading(false);

        const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
        if (readmeFile) {
          setReadmeLoading(true);
          fetch(`/api/file?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' })
            .then(res => {
              if (!res.ok) throw new Error('Could not fetch README content.');
              return res.json();
            })
            .then(readmeData => {
              const decodedContent = atob(readmeData.content);
              setReadmeContent(decodedContent);
              setReadmeLoading(false);
            })
            .catch(err => {
              console.error(err);
              setReadmeLoading(false);
            });
        }

        data.forEach(file => {
          const cachedData = cache.get(file.sha);
          if (cachedData) {
            setMetadataCache(prev => ({ ...prev, [file.sha]: cachedData }));
          } else {
            fetchMetadata(file);
          }
        });
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
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

  const handleOpen = (fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;
    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      navigate(`/editor?path=${file.path}`);
    }
  };

  const handleGoHome = () => setPath('src/pages');
  const handleDuplicate = async (fileToDuplicate) => { /* ... logic ... */ };
  const handleLongPress = (file, event) => setContextMenu({ x: event.clientX, y: event.clientY, file });
  const handleCloseContextMenu = () => setContextMenu(null);
  const handleDeleteRequest = (file) => setFileToDelete(file);
  const handleDeleteConfirm = async () => { /* ... logic ... */ };
  const handleShare = (file) => { /* ... logic ... */ };
  const handleRenameRequest = (file) => setFileToRename(file);
  const handleToggleReadme = () => setReadmeVisible(prev => !prev);
  const handleRenameConfirm = async (file, newName) => { /* ... logic ... */ };

  if (loading) return <div className="text-center p-8 text-gray-500 animate-pulse">Loading files...</div>;
  if (error) return <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  const isAtRoot = path === 'src/pages';
  const getCurrentFolderName = () => isAtRoot ? 'Home' : path.split('/').pop();

  return (
    <div className="relative min-h-[calc(100vh-250px)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
        {Array.isArray(files) && files.filter(file => !file.name.startsWith('_') && file.name.toLowerCase() !== 'readme.md').map(file => (
          <FileTile
            key={file.sha}
            file={file}
            isSelected={selectedFile && selectedFile.sha === file.sha}
            metadata={metadataCache[file.sha]}
            onClick={handleFileClick}
            onLongPress={(e) => handleLongPress(file, e)}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 flex justify-between items-center p-2 z-10">
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
      </div>
      {isCreateModalOpen && <CreateModal path={path} repo={repo} onClose={() => setCreateModalOpen(false)} onCreate={fetchFiles} />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={handleCloseContextMenu} onRename={handleRenameRequest} onDelete={handleDeleteRequest} onDuplicate={handleDuplicate} onShare={handleShare} onAssignLayout={handleAssignLayoutRequest} />}
      {fileToAssignLayout && <AssignTemplateModal file={fileToAssignLayout} onClose={() => setFileToAssignLayout(null)} onAssign={handleAssignLayoutConfirm} />}
      {fileToDelete && <ConfirmDialog message={`Are you sure you want to delete "${fileToDelete.name}"?`} onConfirm={handleDeleteConfirm} onCancel={() => setFileToDelete(null)} />}
      {fileToRename && <RenameModal file={fileToRename} onClose={() => setFileToRename(null)} onRename={handleRenameConfirm} />}
    </div>
  );
}

export default FileExplorer;