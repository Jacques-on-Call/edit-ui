import { useState } from 'preact/hooks';

export function RenameModal({ item, onClose, onRename }) {
  const [newName, setNewName] = useState(item.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName && newName !== item.name) {
      onRename(item, newName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Rename {item.type === 'dir' ? 'Folder' : 'File'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newName}
            onInput={(e) => setNewName(e.currentTarget.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
              disabled={!newName || newName === item.name}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
