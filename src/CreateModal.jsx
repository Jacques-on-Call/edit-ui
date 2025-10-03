import { useState } from 'react';
import { Buffer } from 'buffer';

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
        content = Buffer.from(templateData.content, 'base64').toString('utf8');
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
      // NOTE: Navigation to editor is removed as the route doesn't exist yet.
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mt-0 mb-6 text-xl text-gray-800">Create New</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 font-medium text-gray-600">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
              className="w-full p-3 text-base border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-600">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-normal">
                <input
                  type="radio"
                  name="type"
                  value="file"
                  checked={type === 'file'}
                  onChange={() => setType('file')}
                />
                File
              </label>
              <label className="flex items-center gap-2 font-normal">
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
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="py-2 px-5 text-base rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="py-2 px-5 text-base rounded-lg bg-green-600 text-white hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;