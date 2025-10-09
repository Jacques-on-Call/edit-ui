import React from 'react';
import { useNode } from '@craftjs/core';
import { Hero } from './Hero';
import { HeroSettings } from './HeroSettings';

export const EditorHero = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <Hero {...props} />
    </div>
  );
};

EditorHero.craft = {
  displayName: 'EditorHero',
  props: {
    title: 'This is the Hero Title',
    subtitle: 'This is the hero subtitle. Click here to edit.',
    style: {
      paddingTop: '80px',
      paddingBottom: '80px',
      backgroundColor: '#f7fafc',
    },
  },
  related: {
    settings: HeroSettings,
  },
};