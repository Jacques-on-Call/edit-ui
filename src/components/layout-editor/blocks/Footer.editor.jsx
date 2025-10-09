import React from 'react';
import { useNode } from '@craftjs/core';
import { Footer } from './Footer';
import { FooterSettings } from './FooterSettings';

export const EditorFooter = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <Footer {...props} />
    </div>
  );
};

EditorFooter.craft = {
  displayName: 'EditorFooter',
  props: {
    text: 'Your Company, Inc. All rights reserved.',
    style: {
      backgroundColor: '#ffffff',
      paddingTop: '48px',
      paddingBottom: '48px',
    },
  },
  related: {
    settings: FooterSettings,
  },
};