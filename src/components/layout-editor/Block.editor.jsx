import React from 'react';
import { Canvas } from '@craftjs/core';
import { Block } from './render/Block';

export const EditorBlock = (props) => {
  return (
    <Block {...props}>
      <Canvas id="block-canvas" />
    </Block>
  );
};

EditorBlock.craft = {
  displayName: 'Block',
  isCanvas: true, // Allows other components to be dropped inside
  props: {
    style: {
      padding: '16px',
      border: '1px dashed #ccc',
      minHeight: '50px',
    },
  },
  related: {
    // Settings will be defined here later
  },
};