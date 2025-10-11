import React from 'react';
import { useNode } from '@craftjs/core';

export const Text = ({ text }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p>{text}</p>
    </div>
  );
};

// For now, settings are minimal. This can be expanded later.
const TextSettings = () => {
  return <div></div>;
};

Text.craft = {
  props: {
    text: 'Hi',
  },
  related: {
    settings: TextSettings,
  },
};