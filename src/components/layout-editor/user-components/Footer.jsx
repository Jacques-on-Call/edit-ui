import React from 'react';

export const Footer = () => {
  return (
    <div style={{ padding: '20px', border: '1px dashed #ccc', margin: '10px 0', textAlign: 'center', backgroundColor: '#f0f8ff' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Footer Component</p>
      <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>This is a visual placeholder for the &lt;Footer /&gt;.</p>
    </div>
  );
};

// Craft.js settings
Footer.craft = {
  props: {},
  related: {
    settings: () => null,
  },
};