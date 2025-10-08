import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';
import JsonDebugModal from './JsonDebugModal';

export const Sidebar = ({ onSave }) => {
  const [isJsonDebugModalOpen, setJsonDebugModalOpen] = useState(false);
  const { selectedId, enabled, query } = useEditor((state) => {
    const [id] = state.events.selected;
    return {
      selectedId: id,
      enabled: state.options.enabled,
    };
  });

  let selected;
  if (selectedId) {
    const node = query.node(selectedId).get();
    selected = {
      id: selectedId,
      name: node.data.displayName,
      settings: node.related && node.related.settings,
    };
  }

  const handleShowJson = () => {
    if (enabled) {
      setJsonDebugModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {selected ? `Settings: ${selected.name}` : 'Toolbox'}
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {selected && selected.settings ? (
            React.createElement(selected.settings)
          ) : (
            <Toolbox />
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
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