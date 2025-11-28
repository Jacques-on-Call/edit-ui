import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud, CheckCircle, AlertCircle, RefreshCw, Eye, Pencil } from 'lucide-preact';
import './BottomActionBar.css';

export default function BottomActionBar({ saveStatus, syncStatus = 'idle', viewMode = 'editor', onSync, onAdd, onPreview }) {
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
      <button type="button" onClick={() => route('/explorer')} className="bar-btn" aria-label="Home">
        <Home size={28} />
      </button>

      <button type="button" onClick={onAdd} className="bar-btn bar-add" aria-label="Add Section">
        <Plus size={32} />
      </button>

      {onPreview && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPreview(e);
          }}
          className="bar-btn"
          aria-label={viewMode === 'editor' ? 'Preview' : 'Edit'}
        >
          {viewMode === 'editor' ? <Eye size={28} /> : <Pencil size={28} />}
        </button>
      )}

      <div class="publish-container">
        <button
          type="button"
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
