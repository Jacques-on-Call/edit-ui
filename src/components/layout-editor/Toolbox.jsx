import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { EditorHero } from './blocks/Hero.editor';

export const Toolbox = () => {
  const { actions, query } = useEditor();

  const addHeroToCanvas = () => {
    const rootNodeId = query.getNodesByCanvasId('ROOT-CANVAS')[0];
    if (!rootNodeId) {
        console.error("Could not find the root canvas node. Cannot add component.");
        return;
    }
    const newHeroNode = <Element is={EditorHero} canvas />;
    actions.add(newHeroNode, rootNodeId);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-2 flex justify-center items-center shadow-top">
      <button
        onClick={addHeroToCanvas}
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all"
      >
        Add Hero
      </button>
    </div>
  );
};