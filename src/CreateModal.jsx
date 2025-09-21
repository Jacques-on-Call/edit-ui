import { useState } from 'react';
import './CreateModal.css';

function CreateModal({ path, repo, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('file'); // 'file' or 'folder'
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Slugify function to create a URL-friendly and filesystem-friendly name
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')       // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required.');
      return;
    }
    setIsCreating(true);
    setError(null);

    const slug = slugify(name);
    // Append .astro for files, but not for folders
    const finalName = type === 'file' ? `${slug}.astro` : slug;

    // For folders, GitHub API requires creating a file within it. A .gitkeep is standard.
    const fullPath = type === 'folder' ? `${path}/${finalName}/.gitkeep` : `${path}/${finalName}`;
    const content = ''; // New files will be empty.

    try {
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
