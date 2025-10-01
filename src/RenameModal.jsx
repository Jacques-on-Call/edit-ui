import { useState } from 'react';
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';

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
      onClose();
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      await onRename(file, newName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const formGroupClasses = "mb-6";
  const labelClasses = "block mb-2 font-medium text-gray-600";
  const inputClasses = "w-full p-3 border border-gray-300 rounded-md text-base bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Modal
      title={`Rename "${file.name}"`}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isRenaming}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" onClick={handleSubmit} disabled={isRenaming}>
            {isRenaming ? 'Renaming...' : 'Rename'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className={formGroupClasses}>
          <label htmlFor="newName" className={labelClasses}>New Name</label>
          <input
            type="text"
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClasses}
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </div>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </form>
    </Modal>
  );
}

export default RenameModal;