import React, { useState, useEffect } from 'react';

const AssignLayoutModal = ({ onClose, onAssign, currentPath }) => {
  const [astroLayouts, setAstroLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState('');

  useEffect(() => {
    const fetchLayouts = async () => {
      setLoading(true);
      try {
        const selectedRepo = localStorage.getItem('selectedRepo');
        const qs = selectedRepo ? `?repo=${encodeURIComponent(selectedRepo)}` : '';
        // Fetch file-based .astro layouts only
        const astroRes = await fetch(`/api/astro-layouts${qs}`, { credentials: 'include' });
        const astroData = await astroRes.json();
        if (astroRes.ok) {
          // Keep only .astro files and normalize fields we need
          const onlyAstro = (Array.isArray(astroData) ? astroData : []).filter(f => f.name?.endsWith('.astro'));
          setAstroLayouts(onlyAstro);
        } else {
          console.error('Failed to fetch astro layouts:', astroData?.error || astroRes.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch layouts:", error);
      }
      setLoading(false);
    };

    fetchLayouts();
  }, []);

  const handleAssign = () => {
    if (selectedLayout) {
      onAssign(selectedLayout);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Assign Layout</h2>
        <p className="mb-4 text-gray-600">Choose a layout for <span className="font-semibold">{currentPath}</span>.</p>

        {loading ? (
          <div className="text-center p-8">Loading...</div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-lg border-b pb-2">File-based Layouts (src/layouts)</h3>
            <div className="space-y-2">
              {astroLayouts.length === 0 && (
                <div className="text-sm text-gray-500">No layouts found in src/layouts.</div>
              )}
              {astroLayouts.map(layout => (
                <div key={layout.path || layout.sha || layout.name} className="p-2 border rounded-md hover:bg-gray-100">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="layout"
                      value={layout.path}
                      checked={selectedLayout === layout.path}
                      onChange={(e) => setSelectedLayout(e.target.value)}
                    />
                    <span className="truncate" title={layout.path}>{layout.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedLayout || loading}
            className="px-4 py-2 rounded-md text-white bg-bark-blue hover:bg-opacity-90 disabled:bg-gray-400"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignLayoutModal;
