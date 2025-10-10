import React from 'react';

/**
 * A responsive, mobile-first sidebar that displays a live feed of errors
 * and diagnostic information for an Astro layout. It appears as a full-screen
 * overlay on mobile and a side panel on larger screens.
 *
 * @param {{ report: object; onClose: () => void; }} props
 */
const DebugSidebar = ({ report, onClose }) => {
  if (!report) return null;

  const { errors, frontmatter, components, islands, filePath } = report;

  return (
    // Overlay container for mobile-first design
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-30 md:relative md:inset-auto md:bg-transparent md:z-auto"
      onClick={onClose}
    >
      <div
        className="w-full h-full bg-gray-50 shadow-lg md:w-96 md:border-l md:border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sidebar
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Debug Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">File Path</h3>
          <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded break-all">{filePath}</p>
        </div>

        <div>
          <h3 className="font-semibold text-red-600 mb-2">Errors ({errors.length})</h3>
          <div className="space-y-2">
            {errors.map((err, index) => (
              <div key={index} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-700">{err}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Frontmatter</h3>
          <div className="bg-gray-800 text-white p-3 rounded-lg text-xs overflow-x-auto">
            <pre><code>{JSON.stringify(frontmatter, null, 2)}</code></pre>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Detected Components ({components.length})</h3>
          <div className="space-y-2">
            {components.length > 0 ? (
              components.map((c, index) => (
                <p key={index} className="text-sm text-gray-800 bg-gray-100 p-2 rounded">{c}</p>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">None detected.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-600 mb-2">Detected Islands ({islands.length})</h3>
          <div className="space-y-2">
            {islands.length > 0 ? (
              islands.map((island, index) => (
                <p key={index} className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded">{island}</p>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No client-side islands detected.</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSidebar;