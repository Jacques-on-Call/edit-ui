import React from 'react';

const DebuggerPanel = ({ title, content, language = 'json' }) => (
  <div style={{ flex: 1, minWidth: '300px', margin: '0 10px' }}>
    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px', fontSize: '16px' }}>
      {title}
    </h3>
    <pre style={{
      backgroundColor: '#f4f4f4',
      border: '1px solid #ddd',
      padding: '10px',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: '300px',
      overflowY: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <code>
        {language === 'json' ? JSON.stringify(content, null, 2) : content}
      </code>
    </pre>
  </div>
);

export const LayoutDebugger = ({ astroInput, craftJson, generatedAstro }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '2px solid #007bff',
      padding: '20px',
      zIndex: 100,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start'
    }}>
      <h2 style={{ position: 'absolute', top: '-50px', left: '20px', backgroundColor: '#007bff', color: 'white', padding: '5px 15px', borderRadius: '5px 5px 0 0', margin: 0 }}>
        Layout Debugger
      </h2>
      <DebuggerPanel title="1. Astro Input (.astro file)" content={astroInput} language="text" />
      <DebuggerPanel title="2. Parsed Craft.js JSON" content={craftJson} language="json" />
      <DebuggerPanel title="3. Generated Astro Output" content={generatedAstro} language="text" />
    </div>
  );
};