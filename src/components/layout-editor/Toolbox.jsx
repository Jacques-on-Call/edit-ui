import React from 'react';
import { useEditor } from '@craftjs/core';
import { EditorBlock } from './Block.editor';

const DraggableItem = ({ component, name }) => {
  const { connectors } = useEditor();
  return (
    <div
      ref={(ref) => connectors.create(ref, component)}
      className="p-2 mb-2 bg-white border border-gray-300 rounded cursor-grab hover:bg-gray-50"
    >
      {name}
    </div>
  );
};

export const Toolbox = () => {
  return (
    <div>
      <h2 className="text-md font-medium mb-2">Toolbox</h2>
      <p className="text-sm text-gray-600 mb-4">Drag components to the canvas</p>
      <DraggableItem component={<EditorBlock />} name="Block" />
      {/* Add other draggable components here */}
    </div>
  );
};