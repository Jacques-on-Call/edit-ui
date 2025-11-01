import { useState } from 'preact/compat';
import Icon from './Icon';

function RenameModal({ file, onClose, onRename }) {
  const [newName, setNewName] = useState(file.name);
  const [error, setError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName) {
      setError('Name is required.');
      return;
    }
    if (newName === file.name) {
      onClose();
      return;
    }
    setError('');
    setIsRenaming(true);

    // As there is no dedicated rename endpoint, we will have to handle this on the client-side
    // by creating a new file and deleting the old one. This will be implemented in the FileExplorer component.
    // For now, this modal will just pass the new name back to the parent.
    onRename(file, newName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Rename File</h2>
        <form onSubmit={handleRename}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newName">
              New Name
            </label>
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300"
              disabled={isRenaming}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
              disabled={isRenaming}
            >
              {isRenaming ? (
                <Icon name="loader" className="animate-spin mr-2" />
              ) : (
                <Icon name="check" className="mr-2" />
              )}
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
