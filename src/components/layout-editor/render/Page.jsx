import React from 'react';
import { useNode, Canvas } from '@craftjs/core';

export const Page = ({ children, style }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={style}
      className="bg-white shadow-lg p-4 m-8"
    >
      <Canvas id="page-canvas">{children}</Canvas>
    </div>
  );
};

// We need to define the Craft.js settings for this component.
// `isCanvas: true` is crucial here.
Page.craft = {
  displayName: 'Page',
  isCanvas: true, // This makes it a droppable container
  props: {
    style: {
      backgroundColor: '#ffffff',
      padding: '20px',
      margin: '40px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
  },
  related: {
    // Settings will be defined later
  },
};