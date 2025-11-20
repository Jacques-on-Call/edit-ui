import { h } from 'preact';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-preact';
import './BottomActionBar.css';

export default function BottomActionBar({ saveStatus, syncStatus = 'idle', onSync, onAdd, onPreview }) {

  const getStatusColor = () => {
    if (saveStatus === 'saved') return 'bg-yellow-green';
    return 'bg-scarlet';
  };

  const renderSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw size={28} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={28} className="text-yellow-green" />;
      case 'error':
        return <AlertCircle size={28} className="text-scarlet" />;
      case 'idle':
      default:
        return <UploadCloud size={28} />;
    }
  };

  return (
    <footer className="bottom-action-bar" role="toolbar" aria-label="Editor actions">
      <button onClick={() => route('/explorer')} className="bar-btn" aria-label="Home">
        <Home size={28} />
      </button>

      <button onClick={onAdd} className="bar-btn bar-add" aria-label="Add Section">
        <Plus size={32} />
      </button>

      {onPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(e);
          }}
          className="bar-btn"
          aria-label="Preview"
        >
          <Eye size={28} />
        </button>
      )}

      <div class="publish-container">
        <button
          onClick={() => {
            console.log('[BottomActionBar] Sync button clicked.');
            if (onSync) {
              onSync();
            } else {
              console.error('[BottomActionBar] onSync handler is not defined!');
            }
          }}
          className="bar-btn bar-publish"
          aria-label="Sync to GitHub"
          disabled={syncStatus === 'syncing'}
        >
          {renderSyncIcon()}
        </button>
        <span class={`save-status-dot ${getStatusColor()}`}></span>
      </div>
    </footer>
  );
}
