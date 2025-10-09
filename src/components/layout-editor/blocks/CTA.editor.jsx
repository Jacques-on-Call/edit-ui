import React from 'react';
import { useNode } from '@craftjs/core';
import { CTA } from './CTA';
import { CTASettings } from './CTASettings';

export const EditorCTA = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <CTA {...props} />
    </div>
  );
};

EditorCTA.craft = {
  displayName: 'EditorCTA',
  props: {
    title: 'Ready to Dive In?',
    text: 'Start your free trial today. No credit card required.',
    buttonText: 'Get Started',
    style: {
      backgroundColor: '#2563eb', // Equivalent to bg-blue-600
    },
  },
  related: {
    settings: CTASettings,
  },
};