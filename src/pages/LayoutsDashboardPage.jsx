import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import LayoutContextMenu from '../components/LayoutContextMenu';

const LayoutsDashboardPage = () => {
  const [astroLayouts, setAstroLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadLayouts() {
      setLoading(true);
      setError(null);
      try {
        const selectedRepo = localStorage.getItem('selectedRepo');
        if (!selectedRepo) {
          throw new Error("No repository selected. Please select a repository first.");
        }

        const astroRes = await fetch(`/api/astro-layouts?repo=${encodeURIComponent(selectedRepo)}`, { credentials: 'include' });
        if (!astroRes.ok) throw new Error(`Failed to fetch Astro layouts: ${astroRes.statusText}`);

        const astroRaw = await astroRes.json();
        // Normalize Astro layouts (ensure fields we use exist)
        const normalizedAstro = (Array.isArray(astroRaw) ? astroRaw : [])
          .filter(item => item.name?.endsWith('.astro'))
          .map(item => ({
            id: item.sha || item.path || item.name,
            name: item.name,
            path: item.path,
            updated: item.updated || item.lastModified || null,
            source: 'astro',
          }));

        setAstroLayouts(normalizedAstro);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadLayouts();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Layouts...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

  const handleLongPress = (layout, event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, layout });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleDelete = async (layout) => {
    if (!window.confirm(`Are you sure you want to delete "${layout.name}"?`)) return;

    try {
      const selectedRepo = localStorage.getItem('selectedRepo');
      const res = await fetch('/api/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo: selectedRepo,
          path: layout.path,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete layout.');
      }
      // Refresh list
      setAstroLayouts(prev => prev.filter(l => l.path !== layout.path));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (layout) => {
    try {
      const res = await fetch('/api/duplicate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ path: layout.path }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to duplicate layout.');
      }
      // Re-fetch to include the new duplicate
      const selectedRepo = localStorage.getItem('selectedRepo');
      const astroRes = await fetch(`/api/astro-layouts?repo=${encodeURIComponent(selectedRepo)}`, { credentials: 'include' });
      const astroRaw = await astroRes.json();
      const normalizedAstro = (Array.isArray(astroRaw) ? astroRaw : [])
        .filter(item => item.name?.endsWith('.astro'))
        .map(item => ({
          id: item.sha || item.path || item.name,
          name: item.name,
          path: item.path,
          updated: item.updated || item.lastModified || null,
          source: 'astro',
        }));
      setAstroLayouts(normalizedAstro);
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

  const LayoutCard = ({ layout, onLongPress }) => {
    const isAstro = layout.source === 'astro';

    const pressTimer = React.useRef(null);
    const handlePointerDown = (e) => {
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
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">Astro</span>
          </div>
          {layout.updated && (
            <p className="text-xs text-gray-500 mt-1">Updated: {new Date(layout.updated).toLocaleDateString()}</p>
          )}
        </div>
        <div className="bg-gray-50 p-3">
          <Link
            to={`/layout-editor?path=${layout.path}`}
            className="w-full text-center block bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Open
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" onClick={handleCloseContextMenu}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Layouts</h1>
      </div>

      {astroLayouts.length === 0 && !loading ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">No file-based layouts found.</h3>
          <p className="text-gray-500 mt-2">Add .astro layout files to src/layouts to see them here.</p>
        </div>
      ) : (
        <>
          {/* Astro File-based Layouts */}
          {astroLayouts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4 border-b pb-2">File-based Layouts (src/layouts)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {astroLayouts.map((layout) => (
                  <LayoutCard key={layout.id} layout={layout} onLongPress={handleLongPress} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {contextMenu && (
        <LayoutContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          layout={contextMenu.layout}
          onClose={handleCloseContextMenu}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onShare={() => {/* optional share logic */}}
          onToggleAstro={() => {/* not applicable; keep noop */}}
          onAssignToFolder={() => {/* optional folder logic */}}
          onCreatePage={handleCreatePage}
        />
      )}
    </div>
  );
};

export default LayoutsDashboardPage;
