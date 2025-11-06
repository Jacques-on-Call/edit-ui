import { useState } from 'preact/hooks';
import Icon from './Icon';

function CreateModal({ isOpen, onClose, onCreate, path, repo }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('file'); // 'file' or 'folder'
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    onCreate(name, type);
  };

  const handleClose = () => {
    setName('');
    setType('file');
    setError('');
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/80 border border-white/20 rounded-2xl shadow-lg w-full max-w-md p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="X" className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-lime"
            placeholder={type === 'file' ? 'e.g., my-new-page.astro' : 'e.g., my-new-directory'}
          />
        </div>

        <div className="mb-6">
          <span className="block text-sm font-medium text-gray-300 mb-2">Type</span>
          <div className="flex gap-4">
            <button
              onClick={() => setType('file')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                type === 'file' ? 'bg-accent-lime text-black' : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <Icon name="File" className="w-4 h-4" /> File
            </button>
            <button
              onClick={() => setType('folder')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                type === 'folder' ? 'bg-accent-lime text-black' : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
             <Icon name="Folder" className="w-4 h-4" /> Folder
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-4">
          <button onClick={handleClose} className="px-5 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors font-semibold">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-5 py-2 rounded-lg bg-accent-lime text-black hover:bg-lime-400 transition-colors font-semibold">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateModal;
