import { h } from 'preact';
import { route } from 'preact-router';
import { Home, Plus } from 'lucide-preact';
import './BottomActionBar.css';

/**
 * Bottom action bar for mobile - single Publish button here, Home on left
 */
export default function BottomActionBar({ onAdd, onPublish, showHome = true }) {
  const handleHomeClick = () => {
    console.log('[BottomBar] Home clicked');
    route('/explorer');
  };

  return (
    <footer className="bottom-action-bar" role="toolbar" aria-label="Editor actions">
      <button onClick={handleHomeClick} className="bar-btn" aria-label="Home">
        <Home size={28} />
      </button>
      <button onClick={() => { console.log('[BottomBar] Add clicked'); onAdd && onAdd(); }} className="bar-btn bar-add" aria-label="Add">
        <Plus size={32} />
      </button>
      <button onClick={() => { console.log('[BottomBar] Publish clicked'); onPublish && onPublish(); }} className="bar-btn bar-publish" aria-label="Publish">Publish</button>
    </footer>
  );
}
