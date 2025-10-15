import React from 'react';
import { useNode } from '@craftjs/core';

export const Page = ({ children, style }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  // FIX: A component with `isCanvas: true` should not render another <Canvas> component.
  // It should just render its children directly. The framework handles the canvas context.
  // This was the source of the "Invariant failed" error.
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={style}
      className="bg-white shadow-lg p-4 m-8"
    >
      {children}
    </div>
  );
};

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
  related: {},
};