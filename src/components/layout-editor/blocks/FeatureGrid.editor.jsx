import React from 'react';
import { useNode } from '@craftjs/core';
import { FeatureGrid } from './FeatureGrid';
import { FeatureGridSettings } from './FeatureGridSettings';

export const EditorFeatureGrid = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <FeatureGrid {...props} />
    </div>
  );
};

EditorFeatureGrid.craft = {
  displayName: 'EditorFeatureGrid',
  props: {
    title: 'Discover Our Features',
    features: [
      {
        title: 'Feature One',
        description: 'Description for the first amazing feature.',
      },
      {
        title: 'Feature Two',
        description: 'Description for the second incredible feature.',
      },
      {
        title: 'Feature Three',
        description: 'Description for the third outstanding feature.',
      },
      {
        title: 'Feature Four',
        description: 'Description for the fourth powerful feature.',
      },
    ],
    style: {
      paddingTop: '48px',
      paddingBottom: '48px',
      backgroundColor: '#ffffff',
    },
  },
  related: {
    settings: FeatureGridSettings,
  },
};