import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFKD') // handle accents
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CreateModal({ path, repo, onClose, onCreate }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pageType, setPageType] = useState('astro'); // 'astro' or 'md'
  const [designType, setDesignType] = useState('');
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`/api/files?repo=${repo}&path=src/templates/pages`, { credentials: 'include' });
        if (!response.ok) throw new Error('Could not fetch page templates.');
        const files = await response.json();
        const templateOptions = files
          .filter(file => file.name.endsWith('.astro'))
          .map(file => ({
            name: file.name.replace('.astro', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            path: file.path
          }));
        setTemplates(templateOptions);
        if (templateOptions.length > 0) {
          setDesignType(templateOptions[0].path);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchTemplates();
  }, [repo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (pageType === 'astro' && !designType)) {
      setError('Page name and design type are required for Visual Pages.');
      return;
    }
    setIsCreating(true);
    setError(null);

    try {
      const slug = slugify(name) || 'new-page';
      let finalContent;
      let fullPath;
      let navigateTo;

      if (pageType === 'astro') {
        const templateRes = await fetch(`/api/get-file-content?repo=${repo}&path=${designType}`, { credentials: 'include' });
        if (!templateRes.ok) throw new Error('Could not load template file.');
        const { content: templateContent } = await templateRes.json();
        const pageTitle = name.replace(/"/g, '\\"');
        finalContent = templateContent.replace(/title\s*=\s*".*?"/, `title="${pageTitle}"`);
        const fileName = `${slug}.astro`;
        fullPath = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
        navigateTo = `/visual-editor?path=${fullPath}`;
      } else { // pageType is 'md'
        const pageTitle = name.replace(/"/g, '\\"');
        finalContent = `---
title: "${pageTitle}"
description: "A new content page."
layout: ../../layouts/MainLayout.astro
---

# ${pageTitle}

This is a new page. You can start writing content here.
`;
        const fileName = `${slug}.md`;
        fullPath = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
        navigateTo = `/editor?path=${fullPath}`;
      }

      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content: finalContent }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create page.');
      }

      onCreate?.();
      onClose?.();
      navigate(navigateTo);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Page</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., About Our Company"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bark-blue focus:border-bark-blue"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="astro" checked={pageType === 'astro'} onChange={() => setPageType('astro')} className="form-radio" />
                <span className="ml-2">Visual Page (.astro)</span>
              </label>
              <label className="flex items-center">
                <input type="radio" value="md" checked={pageType === 'md'} onChange={() => setPageType('md')} className="form-radio" />
                <span className="ml-2">Content Page (.md)</span>
              </label>
            </div>
          </div>

          {pageType === 'astro' && (
            <div className="mb-6">
              <label htmlFor="design" className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
              <select
                id="design"
                value={designType}
                onChange={(e) => setDesignType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                disabled={templates.length === 0}
              >
                {templates.length === 0 ? <option>Loading...</option> : templates.map((opt) => (
                  <option key={opt.path} value={opt.path}>{opt.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose a starting point. You can customize everything later.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md border border-gray-300" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-bark-blue text-white hover:bg-opacity-90 disabled:opacity-50" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;
