import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Home, Plus, UploadCloud, CheckCircle, AlertCircle, RefreshCw, Eye, Pencil } from 'lucide-preact';
import './BottomActionBar.css';

export default function BottomActionBar({ saveStatus, syncStatus = 'idle', viewMode = 'editor', onSync, onAdd, onPreview }) {
  useEffect(() => {
    console.log('[DEBUG] BottomActionBar mounting, attaching listeners...');

    const handleResize = () => {
      console.log('--- [DEBUG] Keyboard Resize Event ---');
      console.log(`[DEBUG] window.innerHeight: ${window.innerHeight}`);
      console.log(`[DEBUG] window.visualViewport.height: ${window.visualViewport.height}`);

      // This gets the height of the keyboard
      let keyboardInset = window.innerHeight - window.visualViewport.height;
      console.log(`[DEBUG] Calculated initial keyboardInset: ${keyboardInset}`);


      // --- Defensive Guards ---
      // 1. Prevent negative values which can occur during screen bounce on some mobile browsers.
      if (keyboardInset < 0) {
        console.log('[DEBUG] Clamping negative inset to 0');
        keyboardInset = 0;
      }

      // 2. Prevent excessively large values. A keyboard is never larger than the screen.
      //    This guards against flicker/bugs in the visualViewport API during transitions
      //    which can cause the toolbar to jump to the top of the screen.
      if (keyboardInset > window.innerHeight) {
        console.log('[DEBUG] Clamping oversized inset to 0');
        keyboardInset = 0; // Reset if the value is clearly erroneous
      }

      console.log(`[DEBUG] Final keyboardInset applied: ${keyboardInset}px`);
      console.log('-----------------------------------');


      // This sets a variable that the CSS can use to move the toolbar
      document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
    };

    // Use both visualViewport and window resize events for broader compatibility
    window.visualViewport.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    handleResize(); // Run once on mount to set initial state

    return () => {
      console.log('[DEBUG] BottomActionBar unmounting, cleaning up listeners...');
      window.visualViewport.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.removeProperty('--keyboard-inset'); // Clean up
    };
  }, []);

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
