import React from 'react';

/**
 * A fallback component to display when a layout component fails to load.
 * @param {{ name: string }} props - The name of the component that is missing.
 */
const MissingComponent = ({ name }) => {
  return (
    <div
      style={{
        border: '2px dashed #facc15', // yellow-400
        backgroundColor: '#fef9c3', // yellow-100
        color: '#713f12', // yellow-900
        padding: '16px',
        margin: '8px 0',
        borderRadius: '8px',
        fontFamily: 'monospace',
      }}
    >
      <p style={{ margin: 0, fontWeight: 'bold' }}>
        ⚠️ Component Not Found
      </p>
      <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
        The component <strong>{name}</strong> could not be loaded. Please check the component registry and file path.
      </p>
    </div>
  );
};

export default MissingComponent;