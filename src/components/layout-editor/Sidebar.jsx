import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { useNavigate } from 'react-router-dom';
import { Toolbox } from './Toolbox';
import JsonDebugModal from './JsonDebugModal';
import Icon from '../Icon';

export const Sidebar = ({ onSave }) => {
  const [isJsonDebugModalOpen, setJsonDebugModalOpen] = useState(false);
  const navigate = useNavigate();
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
        <div className="p-2 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <button
            onClick={() => navigate('/layouts')}
            className="p-2 rounded-md hover:bg-gray-200"
            title="Back to Layouts"
          >
            <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 px-4">
            {selected ? selected.name : 'Toolbox'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShowJson}
              className="p-2 rounded-md hover:bg-gray-200 disabled:text-gray-300"
              title="Show Live JSON State"
              disabled={!enabled}
            >
              <Icon name="code" className="w-5 h-5" />
            </button>
            <button
              onClick={onSave}
              className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!enabled}
              title="Save Layout"
            >
              <Icon name="save" className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {selected && selected.settings ? (
            <div className="p-4">{React.createElement(selected.settings)}</div>
          ) : (
            <Toolbox />
          )}
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