import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Text = ({ text }) => {
  const {
    connectors: { connect, drag },
    setProp,
  } = useNode();
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p
        contentEditable={enabled}
        onBlur={(e) => {
          setProp((props) => (props.text = e.target.innerText));
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

// Craft.js settings
Text.craft = {
  props: {
    text: 'Hi',
  },
  rules: {
    canDrag: (node) => node.data.props.text !== 'Drag',
  },
  related: {
    settings: () => null, // No settings panel for now
  },
};