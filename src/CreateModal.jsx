import { useState } from 'react';
import './CreateModal.css';

function CreateModal({ path, repo, onClose, onCreate }) {
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
    let content;

    if (type === 'folder') {
      // For folders, create a .gitkeep file so the directory is not empty.
      fullPath = `${path}/${name}/.gitkeep`;
      content = ''; // .gitkeep files are empty.
    } else {
      // For files, automatically append .astro if not present.
      const fileName = name.endsWith('.astro') ? name : `${name}.astro`;
      fullPath = path === '/' ? fileName : `${path}/${fileName}`;
      // GitHub API requires content for new files. We'll start with a placeholder.
      content = '---\n# Add your frontmatter here\n---\n\n# Start your content here\n';
    }

    try {
      // The repo is now part of the body, not a query param, for consistency.
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create item.');
      }

      onCreate(); // This will trigger a refresh in the parent
      onClose();
    } catch (err) {
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
