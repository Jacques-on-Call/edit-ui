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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4 truncate">Rename "{file.name}"</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bark-blue focus:border-bark-blue"
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              onClick={onClose}
              disabled={isRenaming}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-bark-blue text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bark-blue disabled:opacity-50"
              disabled={isRenaming}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;