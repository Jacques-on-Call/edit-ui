import { useState } from 'preact/hooks';
import Icon from './Icon';
import Modal from './ui/Modal';
import Button from './ui/Button';

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New">
      <div className="text-white">

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
              className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 ${type === 'file' ? 'bg-accent-lime text-black' : 'bg-slate-700/50 hover:bg-slate-700'
                }`}
            >
              <Icon name="File" className="w-4 h-4" /> File
            </button>
            <button
              onClick={() => setType('folder')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 ${type === 'folder' ? 'bg-accent-lime text-black' : 'bg-slate-700/50 hover:bg-slate-700'
                }`}
            >
              <Icon name="Folder" className="w-4 h-4" /> Folder
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { CreateModal };
