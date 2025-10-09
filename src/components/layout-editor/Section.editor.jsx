import React from 'react';
import { Canvas } from '@craftjs/core';
import { Section } from './render/Section';

export const EditorSection = (props) => {
  return (
    <Section {...props}>
      <Canvas id="section-canvas" />
    </Section>
  );
};

EditorSection.craft = {
  displayName: 'EditorSection',
  isCanvas: true, // Allows other components to be dropped inside
  props: {
    style: {
      padding: '16px',
      border: '1px dashed #ccc',
      minHeight: '100px',
    },
  },
  related: {},
};