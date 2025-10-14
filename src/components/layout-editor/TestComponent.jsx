import React from 'react';
import { useNode } from '@craftjs/core';

export const TestComponent = () => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={ref => connect(drag(ref))} style={{ padding: '20px', border: '2px solid green', backgroundColor: '#e8f5e9', textAlign: 'center' }}>
      <h2 style={{ margin: 0, color: '#2e7d32' }}>Test Component</h2>
      <p style={{ margin: '5px 0 0', color: '#555' }}>Hello World</p>
    </div>
  );
};

TestComponent.craft = {
  displayName: 'TestComponent',
  props: {},
  related: {
    settings: () => null,
  },
};