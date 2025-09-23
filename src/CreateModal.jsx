import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateModal.css';

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
        content = '';
      } else {
        console.log('Fetching template...');
        const templateRes = await fetch(`/api/file?repo=${repo}&path=src/pages/_template.astro`, { credentials: 'include' });

        if (!templateRes.ok) {
          console.error('Failed to load template file:', templateRes.status, templateRes.statusText);
          throw new Error('Could not load template file.');
        }

        const templateData = await templateRes.json();
        console.log('Template data received:', templateData);

        content = atob(templateData.content);
        console.log('Decoded template content:', content);

        const fileName = name.endsWith('.astro') ? name : `${name}.astro`;
        fullPath = path === '/' ? fileName : `${path}/${fileName}`;
      }

      console.log('Creating file with path:', fullPath);
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('Failed to create item:', errData);
        throw new Error(errData.error || 'Failed to create item.');
      }

      console.log('File created successfully.');
      onCreate();
      onClose();
      if (type === 'file') {
        console.log('Navigating to editor for new file:', `/edit/${repo}/${fullPath}`);
        navigate(`/edit/${repo}/${fullPath}`);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create New</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="type"
                  value="file"
                  checked={type === 'file'}
                  onChange={() => setType('file')}
                />
                File
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  value="folder"
                  checked={type === 'folder'}
                  onChange={() => setType('folder')}
                />
                Folder
              </label>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="btn-create" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;
