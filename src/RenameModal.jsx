import { useState } from 'react';
import './CreateModal.css'; // Reuse styles from CreateModal

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
      onClose(); // No change, just close
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      // The onRename prop will contain the complex logic
      await onRename(file, newName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Rename "{file.name}"</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newName">New Name</label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()} // Select text on focus
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isRenaming}>
              Cancel
            </button>
            <button type="submit" className="btn-create" disabled={isRenaming}>
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
