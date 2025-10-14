import React from 'react';

export const Header = () => {
  return (
    <div style={{ padding: '20px', border: '1px dashed #ccc', margin: '10px 0', textAlign: 'center', backgroundColor: '#f0f8ff' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Header Component</p>
      <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>This is a visual placeholder for the &lt;Header /&gt;.</p>
    </div>
  );
};

// Craft.js settings
Header.craft = {
  props: {},
  related: {
    settings: () => null,
  },
};