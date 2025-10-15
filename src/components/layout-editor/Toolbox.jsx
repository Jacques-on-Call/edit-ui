import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { EditorHero } from './blocks/Hero.editor';

export const Toolbox = () => {
  const { actions, query } = useEditor();

  const addHeroToCanvas = () => {
    // The main canvas element is the top-level 'Page' component.
    // We find its node ID so we can add the new Hero as a child.
    const rootNodeId = query.getNodesByCanvasId('ROOT-CANVAS')[0];
    if (!rootNodeId) {
        console.error("Could not find the root canvas node. Cannot add component.");
        return;
    }

    // Create a new Hero component to be added to the canvas
    const newHeroNode = <Element is={EditorHero} canvas />;

    // Use the `add` action to append the new node to the root canvas
    actions.add(newHeroNode, rootNodeId);
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Toolbox</h2>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={addHeroToCanvas}
          className="w-full p-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
        >
          Add Hero
        </button>
      </div>
    </div>
  );
};