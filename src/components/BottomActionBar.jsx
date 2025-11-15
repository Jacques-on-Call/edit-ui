import { h } from 'preact';
import './BottomActionBar.css';

/**
 * Bottom action bar for mobile - single Publish button here, Home on left
 */
export default function BottomActionBar({ onAdd, onPublish, showHome = true }) {
  return (
    <footer className="bottom-action-bar" role="toolbar" aria-label="Editor actions">
      {showHome ? (
        <button onClick={() => { console.log('[BottomBar] Home clicked'); window.location.href = '/'; }} className="bar-btn" aria-label="Home">🏠</button>
      ) : <div style={{ width: 48 }} />}
      <button onClick={() => { console.log('[BottomBar] Add clicked'); onAdd && onAdd(); }} className="bar-btn bar-add" aria-label="Add">＋ Add</button>
      <button onClick={() => { console.log('[BottomBar] Publish clicked'); onPublish && onPublish(); }} className="bar-btn bar-publish" aria-label="Publish">Publish</button>
    </footer>
  );
}
