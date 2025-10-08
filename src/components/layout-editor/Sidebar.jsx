import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';
import JsonDebugModal from './JsonDebugModal';

export const Sidebar = ({ onSave }) => {
  const [isJsonDebugModalOpen, setJsonDebugModalOpen] = useState(false);
  const { selected, enabled, query } = useEditor((state) => {
    const [selectedId] = state.events.selected;
    let selectedNode;
    if (selectedId) {
        selectedNode = {
            id: selectedId,
            name: state.nodes[selectedId].data.displayName,
            settings: state.nodes[selectedId].related && state.nodes[selectedId].related.settings,
        };
    }
    return {
        selected: selectedNode,
        enabled: state.options.enabled,
    };
  });

  const handleShowJson = () => {
    if (enabled) {
      setJsonDebugModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-full md:w-96 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            {selected ? `Settings: ${selected.name}` : 'Toolbox'}
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {selected && selected.settings ? (
            <div className="p-4">{React.createElement(selected.settings)}</div>
          ) : (
            <Toolbox />
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={onSave}
              className="flex-grow bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
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