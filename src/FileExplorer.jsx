import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './FileExplorer.css';
import './CreateModal.css';
import './ContextMenu.css';
import './ConfirmDialog.css';
import SearchBar from './search-bar.jsx';
import Icon from './icons.jsx';
import Button from './components/Button/Button'; // Import the new reusable button
import FileTile from './FileTile';
import CreateModal from './CreateModal';
import ContextMenu from './ContextMenu';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';
import ReadmeDisplay from './ReadmeDisplay';
import * as cache from './cache';


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
  const navigate = useNavigate();

  const fetchMetadata = useCallback(async (file) => {
    if (file.type === 'dir') return; // No metadata for directories
    try {
      // This now calls our secure backend endpoint instead of the raw GitHub API
      const res = await fetch(`/api/metadata?repo=${repo}&path=${file.path}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        // The error will be logged but won't crash the page.
        // The UI will just show the "--" placeholder.
        throw new Error(`Failed to fetch metadata: ${res.statusText}`);
      }
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
    setReadmeContent(null); // Reset README content on new folder load
    setReadmeLoading(false); // Reset loading state

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

        // After fetching files, check for a README
        const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
        if (readmeFile) {
          setReadmeLoading(true);
          fetch(`/api/file?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' })
            .then(res => {
              if (!res.ok) throw new Error('Could not fetch README content.');
              return res.json();
            })
            .then(data => {
              const decodedContent = atob(data.content);
              setReadmeContent(decodedContent);
              setReadmeLoading(false);
            })
            .catch(err => {
              console.error(err); // Log README fetch error but don't block UI
              setReadmeLoading(false);
            });
        }

        // Fetch metadata for all files
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
      navigate(`/explorer/file?path=${file.path}`);
    }
  };

  const handleGoHome = () => {
    setPath('src/pages');
  };

  const handleDuplicate = async (fileToDuplicate) => {
    const file = fileToDuplicate || selectedFile;
    if (!file || file.type === 'dir') return;

    try {
      const res = await fetch(`/api/file?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not fetch file content.');
      const content = await res.text();

      const parts = file.name.split('.');
      const ext = parts.length > 1 ? `.${parts.pop()}` : '';
      const baseName = parts.join('.');
      const newName = `${baseName}-copy${ext}`;
      const newPath = `${path}/${newName}`;

      const createRes = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: newPath, content }),
      });
      if (!createRes.ok) throw new Error('Could not create duplicate file.');

      fetchFiles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLongPress = (file, event) => {
    setContextMenu({ x: event.clientX, y: event.clientY, file });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteRequest = (file) => {
    setFileToDelete(file);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      const res = await fetch(`/api/file?repo=${repo}&path=${fileToDelete.path}&sha=${fileToDelete.sha}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete file.');
      cache.remove(fileToDelete.sha); // Invalidate cache
      setFileToDelete(null);
      fetchFiles();
    } catch (err) {
      setError(err.message);
      setFileToDelete(null);
    }
  };

  const handleShare = (file) => {
    const fileUrl = `${window.location.origin}/explorer/file?path=${file.path}`;
    navigator.clipboard.writeText(fileUrl)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Failed to copy link.'));
  };

  const handleRenameRequest = (file) => {
    if (file.type === 'dir') {
      alert('Renaming folders is not supported yet.');
      return;
    }
    setFileToRename(file);
  };

  const handleToggleReadme = () => {
    setReadmeVisible(prev => !prev);
  };

  const handleRenameConfirm = async (file, newName) => {
    const oldPath = file.path;
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;

    const readRes = await fetch(`/api/file?repo=${repo}&path=${oldPath}`, { credentials: 'include' });
    if (!readRes.ok) throw new Error('Failed to read original file.');
    const content = await readRes.text();

    const createRes = await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ repo, path: newPath, content, sha: file.sha }),
    });
    if (!createRes.ok) throw new Error('Failed to create renamed file.');

    const deleteRes = await fetch(`/api/file?repo=${repo}&path=${oldPath}&sha=${file.sha}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!deleteRes.ok) {
      alert('Failed to delete the old file. You may now have a duplicate.');
    } else {
      cache.remove(file.sha); // Invalidate on successful move
    }

    setFileToRename(null);
    fetchFiles();
  };

  if (loading) return <div>Loading files...</div>;
  if (error) return <div>Error: {error}</div>;

  const isAtRoot = path === 'src/pages';

  const getCurrentFolderName = () => {
    if (isAtRoot) return 'Home';
    const segments = path.split('/');
    return segments[segments.length - 1];
  };

  return (
    <div className="file-explorer">
      <div className="search-wrapper">
        <SearchBar repo={repo} />
      </div>
      <div className="file-grid">
        {Array.isArray(files) && files.filter(file => !file.name.startsWith('_')).map(file => (
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
      {isReadmeLoading && <div className="readme-loading">Loading README...</div>}
      {readmeContent && !isReadmeLoading && (
        <ReadmeDisplay
          content={readmeContent}
          isVisible={isReadmeVisible}
          onToggle={handleToggleReadme}
        />
      )}
      <div className="bottom-toolbar">
        <div className="toolbar-section left">
          {/* Deliberately empty to push other elements */}
        </div>
        <div className="toolbar-section center">
          <Button
            variant="fab"
            onClick={() => setCreateModalOpen(true)}
          >
            <Icon name="plus" />
          </Button>
        </div>
        <div className="toolbar-section right">
          <Button variant="icon" onClick={handleGoHome} disabled={isAtRoot}>
            <Icon name="home" />
            <span className="folder-name">{getCurrentFolderName()}</span>
          </Button>
        </div>
      </div>
      {isCreateModalOpen && (
        <CreateModal
          path={path}
          repo={repo}
          onClose={() => setCreateModalOpen(false)}
          onCreate={() => {
            // No specific cache to invalidate on create, let TTL handle directory.
            // A more complex system could track directory SHAs.
            fetchFiles();
          }}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={handleCloseContextMenu}
            onRename={handleRenameRequest}
            onDelete={handleDeleteRequest}
          onDuplicate={handleDuplicate}
          onShare={handleShare}
        />
      )}
      {fileToDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${fileToDelete.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setFileToDelete(null)}
        />
      )}
      {fileToRename && (
        <RenameModal
          file={fileToRename}
          onClose={() => setFileToRename(null)}
          onRename={handleRenameConfirm}
        />
      )}
    </div>
  );
}

export default FileExplorer;
