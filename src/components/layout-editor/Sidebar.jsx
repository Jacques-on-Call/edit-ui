import React from 'react';
import { useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';

export const Sidebar = ({ saveLayout }) => {
  const { selected } = useEditor((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div className="w-80 bg-gray-100 border-l border-gray-200 p-4 flex flex-col">
      <div className="font-semibold text-lg mb-4">Layout Editor</div>

      <div className="flex-grow">
        {selected ? (
          <div>
            <h2 className="text-md font-medium mb-2">Component Settings</h2>
            <p className="text-sm text-gray-600">
              Selected: {selected.size > 0 ? Array.from(selected).join(', ') : 'None'}
            </p>
            {/* Settings panel will go here */}
          </div>
        ) : (
          <Toolbox />
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={saveLayout}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Save Layout
        </button>
      </div>
    </div>
  );
};