import React from 'react';
import { useNode } from '@craftjs/core';

export const GenericElement = ({ tag, children, ...props }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const RenderedTag = tag || 'div'; // Default to a div if no tag is provided

  // A light, dashed border to make all elements visible in the editor
  const style = {
    padding: '10px',
    margin: '5px 0',
    border: '1px dashed #ccc',
    minHeight: '20px', // Ensure small elements are still visible and droppable
  };

  return (
    <RenderedTag ref={(ref) => connect(drag(ref))} style={style} {...props}>
      {children}
    </RenderedTag>
  );
};

// Craft.js settings
GenericElement.craft = {
  isCanvas: true, // This is crucial. It allows dropping other components inside.
  props: {
    tag: 'div', // Default tag
  },
  displayName: 'Element',
  related: {
    // We can add a settings panel later to change the tag, add classes, etc.
    settings: () => null,
  },
};