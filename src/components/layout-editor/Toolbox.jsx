import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { EditorHero } from './blocks/Hero.editor';

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="bg-white border-t border-gray-200 p-2 flex justify-center items-center shadow-top">
      {/*
        This is now a draggable element.
        - `connectors.create` makes this a drag source.
        - `Element` specifies what component to create on drop.
        - `style` includes mobile-specific CSS to ensure it works on iPhone.
      */}
      <div
        ref={ref => connectors.create(ref, <Element is={EditorHero} canvas />)}
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md cursor-grab active:cursor-grabbing"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none', // Prevent iOS callout menu
          touchAction: 'none' // Prevents scrolling while dragging
        }}
      >
        + Add Hero Section
      </div>
    </div>
  );
};