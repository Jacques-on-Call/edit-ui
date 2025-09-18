import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './FileExplorer.css';
import './CreateModal.css';
import './ContextMenu.css';
import './ConfirmDialog.css';
import FileTile from './FileTile';
import CreateModal from './CreateModal';
import ContextMenu from './ContextMenu';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';
import * as cache from './cache';


// SVG Icons for the toolbar
const CreateIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
const DuplicateIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const UpIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const OpenIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;


function FileExplorer({ user, repo }) {
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
  const navigate = useNavigate();

  const fetchMetadata = useCallback(async (file) => {
    if (file.type === 'dir') return; // No metadata for directories
    try {
      // Note: This makes a direct request to GitHub API.
      // This assumes the user is authenticated in the browser session with GitHub
      // or that the API is public. A better long-term solution would be
      // to proxy this through our own backend to protect API keys.
      const res = await fetch(`https://api.github.com/repos/${user.login}/${repo}/commits?path=${file.path}&per_page=1`);
      if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.length > 0) {
        const lastCommit = data[0];
        const metadata = {
          author: lastCommit.commit.author.name,
          date: lastCommit.commit.author.date,
        };
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
        cache.set(file.sha, metadata);
      }
    } catch (err) {
      console.error(`Failed to fetch metadata for ${file.path}:`, err);
      // Don't set an error for the whole page, just for this one file.
    }
  }, [user.login, repo]);


  const fetchFiles = useCallback(() => {
    setLoading(true);
    setSelectedFile(null);
    setMetadataCache({});
    fetch(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch files');
      })
      .then(data => {
        setFiles(data);
        setLoading(false);
        // After fetching files, check cache and fetch metadata for misses
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

  const handleUpOneLayer = () => {
    if (path === 'src/pages') return;
    const newPath = path.substring(0, path.lastIndexOf('/'));
    setPath(newPath || 'src/pages');
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
    } catch (err) => {
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
    } catch (err) => {
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
  const canDuplicate = selectedFile && selectedFile.type !== 'dir';

  return (
    <div className="file-explorer">
      <div className="top-bar">
        <input type="search" placeholder="Search files..." disabled />
      </div>
      <div className="file-grid">
        {Array.isArray(files) && files.map(file => (
          <FileTile
            key={file.sha}
            file={file}
            isSelected={selectedFile && selectedFile.sha === file.sha}
            metadata={metadataCache[file.sha]}
            onClick={handleFileClick}
            onLongPress={(e) => handleLongPress(file, e)}
          />
        ))}
      </div>
      <div className="bottom-toolbar">
        <button className="toolbar-button" onClick={() => handleOpen()} disabled={!selectedFile}>
          <OpenIcon />
          <span>Open</span>
        </button>
        <button className="toolbar-button" onClick={() => setCreateModalOpen(true)}>
          <CreateIcon />
          <span>Create</span>
        </button>
        <button className="toolbar-button" onClick={() => handleDuplicate()} disabled={!canDuplicate}>
          <DuplicateIcon />
          <span>Duplicate</span>
        </button>
        <button className="toolbar-button" onClick={handleUpOneLayer} disabled={isAtRoot}>
          <UpIcon />
          <span>Up</span>
        </button>
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
          repo={repo}
          onClose={() => setFileToRename(null)}
          onRename={handleRenameConfirm}
        />
      )}
    </div>
  );
}

export default FileExplorer;
