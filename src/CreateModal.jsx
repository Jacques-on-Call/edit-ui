import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateModal.module.css'; // Import the new stylesheet
import Button from './components/Button/Button'; // Import the reusable Button component

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
        // Fetch a template to create a new file with some default content
        const templateRes = await fetch(`/api/file?repo=${repo}&path=src/pages/_template.astro`, { credentials: 'include' });
        if (!templateRes.ok) {
          throw new Error('Could not load template file.');
        }
        const templateData = await templateRes.json();
        content = atob(templateData.content);
        const fileName = name.endsWith('.astro') ? name : `${name}.astro`;
        fullPath = path === '/' ? fileName : `${path}/${fileName}`;
      }

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

      onCreate(); // Refresh the file list
      onClose();  // Close the modal
      if (type === 'file') {
        // Navigate to the editor for the new file
        navigate(`/edit/${repo}/${fullPath}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create New</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
            />
            <div className={styles.pathPreview}>
              Will be created at: {path.replace('src/pages', 'Home')}/{name}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Type</label>
            <div className={styles.radioGroup}>
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
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreating}
              className={styles.createButton} // Add a specific class for styling
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;