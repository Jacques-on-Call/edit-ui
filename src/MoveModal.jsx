import { useState, useEffect, useCallback } from 'react';
import styles from './MoveModal.module.css';
import Button from './components/Button/Button';
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
        // If a directory is not found, we can just ignore it.
        console.warn(`Could not fetch directory: ${path}`);
        return;
      }
      const items = await res.json();
      const subDirs = items.filter(item => item.type === 'dir');

      accumulatedDirs.push({ path, name: path.split('/').pop() });

      // Recursively fetch subdirectories
      for (const dir of subDirs) {
        await fetchDirectories(dir.path, accumulatedDirs);
      }
    } catch (err) {
      // Log error but don't crash the UI. The user will see a loading error.
      console.error(`Failed to process directory ${path}:`, err);
      setError('Could not load all directories.');
    }
  }, [repo]);


  useEffect(() => {
    const loadAllDirs = async () => {
      setIsLoading(true);
      const allDirs = [];
      // Start fetching from the root of the content directory.
      await fetchDirectories('src/pages', allDirs);

      // Sort directories alphabetically for consistent display
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
      // The onMove function from the parent handles the API logic
      await onMove(file, selectedPath);
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleSelectPath = (path) => {
    setSelectedPath(path);
    setError(null); // Clear error on new selection
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Move "{file.name}"</h2>
        <div className={styles.currentLocation}>
          <FolderIcon />
          <span>Current: {file.path.substring(0, file.path.lastIndexOf('/'))}</span>
        </div>

        <div className={styles.folderListContainer}>
          {isLoading ? (
            <p>Loading folders...</p>
          ) : (
            <ul className={styles.folderList}>
              {directories.map(dir => (
                <li
                  key={dir.path}
                  className={`${styles.folderItem} ${selectedPath === dir.path ? styles.selected : ''}`}
                  onClick={() => handleSelectPath(dir.path)}
                >
                  <FolderIcon />
                  {/* Make the path more readable */}
                  {dir.path.replace('src/pages', 'Home')}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isMoving || !selectedPath}>
            {isMoving ? 'Moving...' : 'Move to Selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;