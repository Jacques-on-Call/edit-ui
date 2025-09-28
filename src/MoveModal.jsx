import { useState } from 'react';
import styles from './MoveModal.module.css';
import Button from './components/Button/Button';

function MoveModal({ file, onClose, onMove }) {
  const [newPath, setNewPath] = useState('');
  const [error, setError] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPath) {
      setError('A new path is required.');
      return;
    }
    // Basic validation: ensure it's a valid-looking path.
    // More complex validation could be added later.
    if (!newPath.startsWith('src/pages')) {
        setError('Path must start with "src/pages".');
        return;
    }

    setIsMoving(true);
    setError(null);

    // The onMove function will handle the actual API call logic
    onMove(file, newPath)
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsMoving(false);
      });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Move "{file.name}"</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="newPath">New Path</label>
            <input
              type="text"
              id="newPath"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g., src/pages/new-folder/"
              autoFocus
            />
            <div className={styles.pathPreview}>
                Current path: {file.path.substring(0, file.path.lastIndexOf('/'))}
            </div>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isMoving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isMoving}>
              {isMoving ? 'Moving...' : 'Move'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MoveModal;