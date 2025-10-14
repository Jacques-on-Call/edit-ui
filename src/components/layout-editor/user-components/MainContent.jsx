import React from 'react';
import { useNode } from '@craftjs/core';

export const MainContent = ({ children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        padding: '30px',
        border: '2px dashed #63b3ed',
        margin: '10px 0',
        minHeight: '200px',
        textAlign: 'center',
        backgroundColor: '#ebf8ff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p style={{ margin: 0, fontWeight: 'bold', color: '#2c5282' }}>Main Content Area (&lt;slot /&gt;)</p>
      <p style={{ margin: '5px 0 15px', fontSize: '12px', color: '#4a5568' }}>
        This container represents the `<slot />`. You can drag other components here.
      </p>
      <div style={{ width: '100%' }}>{children}</div>
    </div>
  );
};

// Craft.js settings
MainContent.craft = {
  isCanvas: true, // This is crucial to allow dropping other components inside
  props: {},
  related: {
    settings: () => null,
  },
};