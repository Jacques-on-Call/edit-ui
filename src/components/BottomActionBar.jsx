import { h } from 'preact';
import { memo } from 'preact/compat';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud, CheckCircle, AlertCircle, RefreshCw, Eye, Pencil } from 'lucide-preact';
import './BottomActionBar.css';
import { getPageScoreColor } from '../lib/pageScoring';

const BottomActionBar = memo((props) => {
  const {
    saveStatus,
    syncStatus = 'idle',
    viewMode = 'editor',
    previewState = 'idle',
    pageScore = null,
    onSync,
    onAdd,
    onPreview,
    onRefreshPreview,
    needsDeployment
  } = props;
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
    if (viewMode === 'editor') {
      return <Eye size={28} className={needsDeployment ? 'text-orange-500' : ''} />;
    }
    return <Pencil size={28} />;
  };

  // Get accessible label for preview button
  const getPreviewLabel = () => {
    if (viewMode === 'editor') {
      return needsDeployment ? 'Setup Deployment' : 'Preview';
    }
    return 'Edit';
  };

  // Check if we're in preview mode
  const isInPreviewMode = viewMode === 'livePreview';

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
        </button>
      )}

      {/* Refresh button - only visible in preview mode */}
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
          className="bar-btn relative"
          aria-label="Sync Publish"
          disabled={syncStatus === 'syncing'}
        >
          {renderSyncIcon()}
          {/* Save status dot positioned relative to sync button */}
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black/50 ${getStatusColor()}`}></span>
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
    </footer>
  );
});

export default BottomActionBar;
