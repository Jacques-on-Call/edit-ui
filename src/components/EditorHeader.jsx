import { h } from 'preact';
import './EditorHeader.css';

/**
 * EditorHeader - keep compact on mobile; header Publish hidden on mobile.
 * Expects prop isMobile (boolean) to be passed from ContentEditorPage.
 */
export default function EditorHeader({ title, onPublish, isSaving, activeTab, onTabSwitch, onToggleBlocks, onToggleInspector, isMobile }) {
  console.log('[EditorHeader] render - title:', title, 'activeTab:', activeTab, 'isSaving:', isSaving, 'isMobile:', !!isMobile);
  return (
    <header className="editor-header" role="banner" aria-label="Editor header">
      <div className="left">
        <button className="btn-plain" onClick={() => { console.log('[EditorHeader] back clicked'); window.history.back(); }} aria-label="Back">Back</button>
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="center">
        {/* Hide tabs on smallest mobile screens; will be revisited in a later sprint */}
        {!isMobile && (
          <nav className="tabs" role="tablist" aria-label="Editor tabs">
            <button className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => onTabSwitch('content')}>Content</button>
            <button className={`tab ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => onTabSwitch('visual')}>Visual</button>
          </nav>
        )}
      </div>

      <div className="right">
        {/* Compact toggles available on mobile (optional) */}
        {isMobile && (
          <>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] blocks toggle clicked'); onToggleBlocks && onToggleBlocks(); }} title="Blocks">☰</button>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] inspector toggle clicked'); onToggleInspector && onToggleInspector(); }} title="Inspect">⚙</button>
          </>
        )}

        <span className="saving-indicator" aria-live="polite">{isSaving ? 'Saving…' : ''}</span>

        {/* Do not render the header Publish button on mobile to avoid duplicates with bottom bar */}
        {!isMobile && <button className="btn-primary" onClick={onPublish}>Publish</button>}
      </div>
    </header>
  );
}
