import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';
import JsonDebugModal from './JsonDebugModal';

export const Sidebar = ({ saveLayout }) => {
  const [isJsonDebugModalOpen, setJsonDebugModalOpen] = useState(false);
  const { selected, query, enabled } = useEditor((state, query) => ({
    selected: state.events.selected,
    query: query,
    enabled: state.options.enabled,
  }));

  const handleShowJson = () => {
    if (enabled) {
      setJsonDebugModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-80 bg-gray-100 border-l border-gray-200 p-4 flex flex-col">
        <div className="font-semibold text-lg mb-4">Layout Editor</div>

        <div className="flex-grow overflow-y-auto">
          {selected && selected.size > 0 ? (
            <div>
              <h2 className="text-md font-medium mb-2">Component Settings</h2>
              <p className="text-sm text-gray-600">
                Selected: {Array.from(selected).join(', ')}
              </p>
              {/* Settings panel will go here */}
            </div>
          ) : (
            <Toolbox />
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={saveLayout}
              className="flex-grow bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={!enabled}
            >
              Save Layout
            </button>
            <button
              onClick={handleShowJson}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
              title="Show Live JSON State"
              disabled={!enabled}
            >
              JSON
            </button>
          </div>
        </div>
      </div>
      {enabled && isJsonDebugModalOpen && (
        <JsonDebugModal
          json={JSON.parse(query.serialize())}
          onClose={() => setJsonDebugModalOpen(false)}
        />
      )}
    </>
  );
};