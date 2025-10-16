import React from 'react';
import { useNode } from '@craftjs/core';

export const Page = ({ children, style }) => {
  const {
    connectors: { connect }, // REMOVED 'drag' - canvas shouldn't be draggable
  } = useNode();

  return (
    <div
      ref={(ref) => connect(ref)} // ONLY connect, NO drag
      style={style}
      className="bg-white shadow-lg p-4 m-8 min-h-[500px]" // Added min-height for better drop target
    >
      {children}
    </div>
  );
};

Page.craft = {
  displayName: 'Page',
  isCanvas: true,
  props: {
    style: {
      backgroundColor: '#ffffff',
      padding: '20px',
      margin: '40px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      minHeight: '500px', // Make the drop zone bigger
    },
  },
  related: {},
};