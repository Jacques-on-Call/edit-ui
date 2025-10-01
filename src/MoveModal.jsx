import { useState, useEffect, useCallback } from 'react';
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';
import { FolderIcon } from './icons.jsx';

function MoveModal({ file, repo, onClose, onMove }) {
  const [directories, setDirectories] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  const fetchDirectories = useCallback(async (path, accumulatedDirs = []) => {
    try {
      const res = await fetch(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' });
      if (!res.ok) {
        console.warn(`Could not fetch directory: ${path}`);
        return;
      }
      const items = await res.json();
      const subDirs = items.filter(item => item.type === 'dir');
      accumulatedDirs.push({ path, name: path.split('/').pop() });
      for (const dir of subDirs) {
        await fetchDirectories(dir.path, accumulatedDirs);
      }
    } catch (err) {
      console.error(`Failed to process directory ${path}:`, err);
      setError('Could not load all directories.');
    }
  }, [repo]);

  useEffect(() => {
    const loadAllDirs = async () => {
      setIsLoading(true);
      const allDirs = [];
      await fetchDirectories('src/pages', allDirs);
      const sortedDirs = allDirs.sort((a, b) => a.path.localeCompare(b.path));
      setDirectories(sortedDirs);
      setIsLoading(false);
    };
    loadAllDirs();
  }, [fetchDirectories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPath) {
      setError('Please select a destination folder.');
      return;
    }
    const currentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    if (selectedPath === currentPath) {
      setError('Cannot move file to its current folder.');
      return;
    }
    setIsMoving(true);
    setError(null);
    try {
      await onMove(file, selectedPath);
      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleSelectPath = (path) => {
    setSelectedPath(path);
    setError(null);
  };

  return (
    <Modal
      title={`Move "${file.name}"`}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isMoving || !selectedPath}>
            {isMoving ? 'Moving...' : 'Move to Selected'}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 px-4 rounded-md mb-4">
        <FolderIcon />
        <span>Current: {file.path.substring(0, file.path.lastIndexOf('/'))}</span>
      </div>

      <div className="border border-gray-300 rounded-md h-48 overflow-y-auto bg-gray-50 p-2">
        {isLoading ? (
          <p className="p-4 text-gray-500">Loading folders...</p>
        ) : (
          <ul className="list-none p-0 m-0">
            {directories.map(dir => (
              <li
                key={dir.path}
                className={`flex items-center gap-3 p-2 cursor-pointer rounded transition-colors duration-200 ${
                  selectedPath === dir.path ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-200'
                }`}
                onClick={() => handleSelectPath(dir.path)}
              >
                <FolderIcon />
                {dir.path.replace('src/pages', 'Home')}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </Modal>
  );
}

export default MoveModal;