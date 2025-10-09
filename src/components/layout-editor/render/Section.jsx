import React from 'react';
import { useNode, Canvas } from '@craftjs/core';

export const Section = ({ children, style }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={style}
      className="p-4 border border-dashed border-gray-400 min-h-[100px]"
    >
      <Canvas id="section-canvas">{children}</Canvas>
    </div>
  );
};

Section.craft = {
  displayName: 'Section',
  isCanvas: true,
};