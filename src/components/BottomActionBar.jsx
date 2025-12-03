import { h } from 'preact';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud, CheckCircle, AlertCircle, RefreshCw, Eye, Pencil, Monitor } from 'lucide-preact';
import './BottomActionBar.css';
import { getPageScoreColor } from '../lib/pageScoring';

export default function BottomActionBar({ 
  saveStatus, 
  syncStatus = 'idle', 
  viewMode = 'editor', 
  previewState = 'idle', // 'idle' | 'building' | 'ready'
  pageScore = null, // Page Score (0-100) or null if not calculated
  onSync, 
  onAdd, 
  onPreview,
  onRefreshPreview
}) {
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

  // Determine preview button icon based on current view mode
  const renderPreviewIcon = () => {
    switch (viewMode) {
      case 'editor':
        return <Eye size={28} />; // Show eye icon to indicate "preview"
      case 'localPreview':
        return <Monitor size={28} />; // Show monitor icon for live preview
      case 'livePreview':
      default:
        return <Pencil size={28} />; // Show pencil to go back to editor
    }
  };

  // Get accessible label for preview button
  const getPreviewLabel = () => {
    switch (viewMode) {
      case 'editor':
        return 'Local Preview';
      case 'localPreview':
        return 'Live Preview';
      case 'livePreview':
      default:
        return 'Edit';
    }
  };

  // Get preview status indicator class
  const getPreviewStatusClass = () => {
    switch (previewState) {
      case 'building':
        return 'bg-yellow-500 animate-pulse';
      case 'ready':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Check if we're in a preview mode (either local or live)
  const isInPreviewMode = viewMode === 'localPreview' || viewMode === 'livePreview';

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
          className="bar-btn relative"
          aria-label={getPreviewLabel()}
        >
          {renderPreviewIcon()}
          {/* Preview status indicator dot */}
          {isInPreviewMode && (
            <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getPreviewStatusClass()}`} />
          )}
        </button>
      )}

      {/* Refresh button - only visible in preview modes */}
      {isInPreviewMode && onRefreshPreview && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRefreshPreview(e);
          }}
          className="bar-btn"
          aria-label="Refresh Preview"
          disabled={previewState === 'building'}
        >
          <RefreshCw size={28} className={previewState === 'building' ? 'animate-spin' : ''} />
        </button>
      )}

      {onSync && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSync(e);
          }}
          className="bar-btn"
          aria-label="Sync Publish"
          disabled={syncStatus === 'syncing'}
        >
          {renderSyncIcon()}
        </button>
      )}

      {/* Page Score display */}
      {pageScore !== null && (
        <div className="page-score-indicator" title={`Page Score: ${pageScore}/100`}>
          <span className={`text-sm font-bold ${getPageScoreColor(pageScore)}`}>
            {pageScore}
          </span>
        </div>
      )}

      <div className="save-status-indicator">
         <span className={`save-status-dot ${getStatusColor()}`}></span>
      </div>
    </footer>
  );
}
