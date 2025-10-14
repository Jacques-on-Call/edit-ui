import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const TextNode = ({ text }) => {
  const {
    connectors: { connect, drag },
    setProp,
  } = useNode();
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <span
      ref={(ref) => connect(drag(ref))}
      contentEditable={enabled}
      suppressContentEditableWarning={true}
      onBlur={(e) => {
        setProp((props) => (props.text = e.target.innerText), 500);
      }}
      style={{ padding: '2px', outline: enabled ? '1px dashed #eee' : 'none' }}
    >
      {text}
    </span>
  );
};

// Craft.js settings
TextNode.craft = {
  isCanvas: false, // Not a container
  props: {
    text: 'Text',
  },
  displayName: 'Text',
  related: {
    settings: () => null, // No settings panel for now
  },
};