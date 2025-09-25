import React from 'react';

// Very small developer-visible overlay to show API and parse state.
// Add <DebugPanel debug={debugState} onClose={() => setShow(false)} /> inside App or FileViewer.
export default function DebugPanel({ debug = {}, onClose }) {
  const style = {
    position: 'fixed',
    right: 12,
    top: 12,
    width: 420,
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 9999,
    background: 'rgba(20,20,20,0.95)',
    color: '#fff',
    fontSize: 12,
    borderRadius: 6,
    padding: 10,
    boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
    lineHeight: '1.2',
  };

  const small = v => {
    try {
      return typeof v === 'string' ? v.slice(0, 400) : JSON.stringify(v, null, 2).slice(0, 400);
    } catch (e) {
      return String(v);
    }
  };

  if (!debug) return null;
  return (
    <div style={style} role="dialog" aria-label="Debug Panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>DEV Debug</strong>
        <div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '4px 6px', borderRadius: 4 }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <div>
        <div><strong>API:</strong> {debug.apiPath || '—'}</div>
        <div><strong>HTTP:</strong> {debug.status || '—'}</div>
        <div><strong>SHA:</strong> {debug.sha || '—'}</div>
        <div style={{ marginTop: 8 }}><strong>Decoded start:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto', background: 'rgba(255,255,255,0.02)', padding: 8 }}>
            {small(debug.decodedSnippet || debug.decoded || '—')}
          </pre>
        </div>

        <div>
          <strong>Parse Type:</strong> {debug.parse?.detected || '—'}
        </div>
        <div>
          <strong>Parse Error:</strong> {debug.parse?.error || '—'}
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Parsed frontmatter (preview):</strong>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto', background: 'rgba(255,255,255,0.02)', padding: 8 }}>
            {small(debug.parse?.parsed || debug.parse?.rawFrontmatter || '—')}
          </pre>
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Editor Ready:</strong> {(debug.editorReady ? 'yes' : 'no') || '—'}
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Notes:</strong>
          <ul style={{ paddingLeft: 16 }}>
            {(debug.notes || ['No notes']).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}