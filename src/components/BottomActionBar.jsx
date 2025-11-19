import { h } from 'preact';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud } from 'lucide-preact';
import './BottomActionBar.css';

export default function BottomActionBar({ saveStatus, onPublish, onAdd }) {

  const getStatusColor = () => {
    if (saveStatus === 'saved') return 'bg-yellow-green'; // yellow-green
    return 'bg-scarlet'; // scarlet
  };

  return (
    <footer className="bottom-action-bar" role="toolbar" aria-label="Editor actions">
      <button onClick={() => route('/explorer')} className="bar-btn" aria-label="Home">
        <Home size={28} />
      </button>

      {/* The "Add Section" button will be enabled in the next step */}
      <button onClick={onAdd} className="bar-btn bar-add" aria-label="Add Section">
        <Plus size={32} />
      </button>

      <div class="publish-container">
        <button onClick={onPublish} className="bar-btn bar-publish" aria-label="Publish">
          <UploadCloud size={28} />
        </button>
        <span class={`save-status-dot ${getStatusColor()}`}></span>
      </div>
    </footer>
  );
}
