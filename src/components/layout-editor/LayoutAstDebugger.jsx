import React from 'react';

const DebuggerPanel = ({ title, content, language = 'json' }) => (
  <div style={{ flex: 1, minWidth: '300px', margin: '0 10px' }}>
    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px', fontSize: '16px', color: '#333' }}>
      {title}
    </h3>
    <pre style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      padding: '15px',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: '250px',
      overflowY: 'auto',
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: '12px',
      lineHeight: '1.5',
    }}>
      <code>
        {language === 'json' ? JSON.stringify(content, null, 2) : content}
      </code>
    </pre>
  </div>
);

export const LayoutAstDebugger = ({ astroInput, ast, craftJson, generatedAstro, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '2px solid #63b3ed',
      padding: '20px',
      zIndex: 100,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      overflowX: 'auto', // Enable horizontal scrolling on small screens
      alignItems: 'flex-start'
    }}>
      <h2 style={{ position: 'absolute', top: '-50px', left: '20px', backgroundColor: '#63b3ed', color: 'white', padding: '5px 15px', borderRadius: '5px 5px 0 0', margin: 0, fontSize: '18px', fontWeight: '600' }}>
        AST Layout Debugger
      </h2>
      <DebuggerPanel title="1. Raw Astro Input" content={astroInput} language="text" />
      <DebuggerPanel title="2. Generated AST" content={ast} language="json" />
      <DebuggerPanel title="3. Craft.js JSON" content={craftJson} language="json" />
      <DebuggerPanel title="4. Generated Astro" content={generatedAstro} language="text" />
    </div>
  );
};