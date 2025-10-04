import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bark-blue focus:border-bark-blue"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="file"
                  checked={type === 'file'}
                  onChange={() => setType('file')}
                  className="h-4 w-4 text-bark-blue focus:ring-bark-blue border-gray-300"
                />
                <span className="ml-2 text-gray-700">File</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="folder"
                  checked={type === 'folder'}
                  onChange={() => setType('folder')}
                  className="h-4 w-4 text-bark-blue focus:ring-bark-blue border-gray-300"
                />
                <span className="ml-2 text-gray-700">Folder</span>
              </label>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-bark-blue text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bark-blue disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;