import { useState } from 'preact/hooks';
import Modal from './ui/Modal';
import Button from './ui/Button';

function CreatePageModal({ isOpen, onClose, onCreate }) {
  const [pageName, setPageName] = useState('');
  const [designType, setDesignType] = useState('General');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!pageName.trim()) {
      setError('Page name is required.');
      return;
    }
    setError('');
    onCreate(pageName, designType);
  };

  const handleClose = () => {
    setPageName('');
    setDesignType('General');
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Page">
      <div className="text-white">

        <div className="mb-4">
          <label htmlFor="pageName" className="block text-sm font-medium text-gray-300 mb-2">Page Name</label>
          <input
            type="text"
            id="pageName"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-lime"
            placeholder="e.g., About Us"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="designType" className="block text-sm font-medium text-gray-300 mb-2">Design Type</label>
          <select
            id="designType"
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-lime"
          >
            <option value="General">General</option>
            <option value="Blog">Blog</option>
            <option value="Service">Service</option>
          </select>
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

export default CreatePageModal;
