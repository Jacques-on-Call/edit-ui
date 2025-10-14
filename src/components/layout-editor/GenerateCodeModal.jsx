import React from 'react';

export const GenerateCodeModal = ({ code, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    }, (err) => {
      alert('Failed to copy code.');
      console.error('Could not copy text: ', err);
    });
  };

  if (!code) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '80%',
          maxWidth: '800px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Generated Astro Code</h2>
        <pre style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          padding: '1rem',
          borderRadius: '4px',
          maxHeight: '60vh',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          <code>{code}</code>
        </pre>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={handleCopy}>Copy to Clipboard</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};