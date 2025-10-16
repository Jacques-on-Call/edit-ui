import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { EditorHero } from './blocks/Hero.editor';

export const Toolbox = () => {
  const { connectors, actions, query } = useEditor();

  const handleTapAdd = () => {
    // Get the ROOT canvas node
    const rootNodeId = query.node('ROOT').get().id;
    // Add the Hero component directly to it
    actions.add(<Element is={EditorHero} />, rootNodeId);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-2 flex justify-center items-center shadow-top">
      <div
        ref={ref => connectors.create(ref, <Element is={EditorHero} />)}
        onClick={handleTapAdd} // This makes it work on mobile with a tap
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md cursor-pointer active:bg-blue-600"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'manipulation' // Changed from 'none' to allow tap
        }}
      >
        + Add Hero Section
      </div>
    </div>
  );
};