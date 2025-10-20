import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';
import ContextMenu from '../components/ContextMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import RenameModal from '../components/RenameModal';

const LayoutsDashboardPage = () => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);
  const navigate = useNavigate();

  const loadLayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedRepo = localStorage.getItem('selectedRepo');
      if (!selectedRepo) {
        throw new Error("No repository selected. Please select a repository first.");
      }

      const res = await fetch(`/api/astro-layouts?repo=${selectedRepo}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch Astro layouts: ${res.statusText}`);
      const rawLayouts = await res.json();

      const normalize = (item) => ({
        id: item.sha || item.path,
        name: item.name?.replace(".astro", "") || "Unnamed Astro Layout",
        source: "astro",
        path: item.path,
        sha: item.sha, // Ensure sha is present for operations
        type: 'file', // for context menu compatibility
      });

      const finalLayouts = (Array.isArray(rawLayouts) ? rawLayouts : [])
        .filter(item => item.name && item.name.endsWith('.astro'))
        .map(normalize);

      setLayouts(finalLayouts);
    } catch (err) {
      console.error("❌ Failed to load layouts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  const handleCreateNewTemplate = async (template) => {
    setModalOpen(false);
    const repo = localStorage.getItem('selectedRepo');
    if (!repo) {
      setError("No repository selected.");
      return;
    }

    const fileName = template.name.endsWith('.astro') ? template.name : `${template.name}.astro`;
    const fullPath = `src/layouts/${fileName}`;
    const content = `---
# Frontmatter for ${fileName}
layout: ../../layouts/MainLayout.astro
title: "${template.name}"
description: "A new layout."
---

<h1>${template.name}</h1>
<p>This is a new layout file. Add your components here.</p>
<slot />
`;

    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: fullPath,
          content: btoa(unescape(encodeURIComponent(content))),
          message: `feat: create new layout ${fileName}`
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create new layout file.');
      }

      // Navigate to the new layout in the editor
      navigate(`/semantic-layout-editor?path=${fullPath}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Layouts...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

  const handleLongPress = (layout, event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, layout });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleDelete = async (file) => {
    if (!file) return;
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo: localStorage.getItem('selectedRepo'),
          path: file.path,
          sha: file.sha
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete file.');
      setFileToDelete(null);
      loadLayouts(); // Refresh
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (file) => {
    handleCloseContextMenu();
    const parts = file.path.split('/');
    const fileName = parts.pop();
    const dir = parts.join('/');
    const nameParts = fileName.split('.');
    const extension = nameParts.pop();
    const baseName = nameParts.join('.');
    const newName = `${baseName}-copy.${extension}`;
    const newPath = `${dir}/${newName}`;

    try {
      const response = await fetch('/api/duplicate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo: localStorage.getItem('selectedRepo'),
          path: file.path,
          newPath
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to duplicate file.');
      loadLayouts(); // Refresh
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenameConfirm = async (file, newName) => {
    if (!file || !newName || newName === file.name) {
      setFileToRename(null);
      return;
    }
    const oldPath = file.path;
    const newFileName = newName.endsWith('.astro') ? newName : `${newName}.astro`;
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newFileName;

    try {
      const response = await fetch('/api/rename-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo: localStorage.getItem('selectedRepo'),
          oldPath,
          newPath,
          sha: file.sha
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to rename file.');
      setFileToRename(null);
      loadLayouts(); // Refresh
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePage = async (layout) => {
    const pageName = window.prompt("Enter a name for the new page (e.g., 'about-us'):");
    if (!pageName) return;

    try {
      const repo = localStorage.getItem('selectedRepo');
      const res = await fetch('/api/create-page-from-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          pageName,
          layoutPath: layout.path,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create page.');
      }
      const data = await res.json();
      navigate(`/editor?path=${data.path}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" onClick={handleCloseContextMenu}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Astro Layouts</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all flex items-center space-x-2"
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Create New Layout</span>
        </button>
      </div>

      {layouts.length === 0 && !loading ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">No Astro layouts found.</h3>
          <p className="text-gray-500 mt-2">Click "Create New Layout" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {layouts.map((layout) => (
            <LayoutCard key={layout.id} layout={layout} onLongPress={handleLongPress} />
          ))}
          <div
            onClick={() => setModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 cursor-pointer text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <Icon name="plus" className="h-8 w-8 mb-2" />
            <span className="font-bold text-center">Create New Layout</span>
          </div>
        </div>
      )}

      {isModalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onSubmit={handleCreateNewTemplate} />}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.layout}
          onClose={handleCloseContextMenu}
          onRename={() => setFileToRename(contextMenu.layout)}
          onDelete={() => setFileToDelete(contextMenu.layout)}
          onDuplicate={() => handleDuplicate(contextMenu.layout)}
          onShare={() => {}} // Not implemented for layouts
          onAssignLayout={() => {}} // Not implemented for layouts
        />
      )}
      {fileToDelete && <ConfirmDialog message={`Are you sure you want to delete "${fileToDelete.name}"?`} onConfirm={() => handleDelete(fileToDelete)} onCancel={() => setFileToDelete(null)} />}
      {fileToRename && <RenameModal file={fileToRename} onClose={() => setFileToRename(null)} onRename={handleRenameConfirm} />}
    </div>
  );
};

const LayoutCard = ({ layout, onLongPress }) => {
  const pressTimer = React.useRef(null);
  const isAstro = layout.source === "astro";
  const hasContent = !!layout.json_content;

  const handlePointerDown = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    if (e.button === 2) return;
    pressTimer.current = setTimeout(() => onLongPress(layout, e), 500);
  };

  const handlePointerUp = () => clearTimeout(pressTimer.current);

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current);
    onLongPress(layout, e);
  };

  return (
    <div
      key={layout.id}
      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${isAstro ? "border-blue-300" : "border-purple-300"}`}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-800 truncate pr-2">{layout.name}</h3>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isAstro ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            {layout.source.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate" title={layout.path}>
          <code>{layout.path}</code>
        </p>

        <div className="text-xs text-gray-400 mt-2">
          {layout.created_at ? `Updated: ${new Date(layout.created_at).toLocaleDateString()}` : "No date"}
        </div>

        {!isAstro && (
          <div className={`mt-3 text-sm font-semibold flex items-center ${hasContent ? "text-green-600" : "text-amber-600"}`}>
            {hasContent ? '✅' : '⚠️'}
            <span className="ml-1.5">{hasContent ? "Content Ready" : "Missing Content"}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3">
        <Link
          to={isAstro ? `/semantic-layout-editor?path=${layout.path}` : layout.path}
          className="w-full text-center block bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Open
        </Link>
      </div>
    </div>
  );
};

export default LayoutsDashboardPage;