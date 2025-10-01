import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';

function CreateModal({ path, repo, onClose, onCreate }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState('file'); // 'file' or 'folder'
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required.');
      return;
    }
    setIsCreating(true);
    setError(null);

    let fullPath;
    try {
      let content;

      if (type === 'folder') {
        fullPath = `${path}/${name}/.gitkeep`;
        content = ''; // No content needed for a .gitkeep file
      } else {
        const templateRes = await fetch(`/api/file?repo=${repo}&path=src/pages/_template.astro`, { credentials: 'include' });
        if (!templateRes.ok) throw new Error('Could not load template file.');
        const templateData = await templateRes.json();
        content = atob(templateData.content);
        const fileName = name.endsWith('.astro') ? name : `${name}.astro`;
        fullPath = path === '/' ? fileName : `${path}/${fileName}`;
      }

      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content: btoa(content) }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create item.');
      }

      onCreate();
      onClose();
      if (type === 'file') {
        navigate(`/edit/${repo}/${fullPath}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const formGroupClasses = "mb-6";
  const labelClasses = "block mb-2 font-medium text-gray-600";
  const inputClasses = "w-full p-3 border border-gray-300 rounded-md text-base bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-500";
  const radioGroupClasses = "flex gap-6";
  const radioLabelClasses = "flex items-center gap-2 font-normal";
  const radioInputClasses = "accent-green";

  return (
    <Modal
      title="Create New"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-green border-light-green text-white hover:enabled:bg-opacity-80"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className={formGroupClasses}>
          <label htmlFor="name" className={labelClasses}>Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            className={inputClasses}
            autoFocus
          />
          <div className="text-xs text-gray-500 mt-2 h-4 break-all">
            Will be created at: {path.replace('src/pages', 'Home')}/{name}
          </div>
        </div>
        <div className={formGroupClasses}>
          <label className={labelClasses}>Type</label>
          <div className={radioGroupClasses}>
            <label className={radioLabelClasses}>
              <input
                type="radio"
                name="type"
                value="file"
                checked={type === 'file'}
                onChange={() => setType('file')}
                className={radioInputClasses}
              />
              File
            </label>
            <label className={radioLabelClasses}>
              <input
                type="radio"
                name="type"
                value="folder"
                checked={type === 'folder'}
                onChange={() => setType('folder')}
                className={radioInputClasses}
              />
              Folder
            </label>
          </div>
        </div>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </form>
    </Modal>
  );
}

export default CreateModal;