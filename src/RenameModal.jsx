import { useState } from 'react';
import styles from './CreateModal.module.css'; // Reuse styles from CreateModal
import Button from './components/Button/Button'; // Import the reusable Button component

function RenameModal({ file, onClose, onRename }) {
  const [newName, setNewName] = useState(file.name);
  const [error, setError] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName) {
      setError('Name is required.');
      return;
    }
    if (newName === file.name) {
      onClose(); // No change, just close the modal
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      // The onRename function from the parent handles the API logic
      await onRename(file, newName);
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Rename "{file.name}"</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="newName">New Name</label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()} // Automatically select text on focus
            />
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isRenaming}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isRenaming}>
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
