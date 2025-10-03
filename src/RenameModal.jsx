import { useState } from 'react';

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
      await onRename(file, newName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mt-0 mb-6 text-xl text-gray-800 break-all">Rename "{file.name}"</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newName" className="block mb-2 font-medium text-gray-600">New Name</label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()}
              className="w-full p-3 text-base border border-gray-300 rounded-lg"
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="py-2 px-5 text-base rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={onClose} disabled={isRenaming}>
              Cancel
            </button>
            <button type="submit" className="py-2 px-5 text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={isRenaming}>
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;