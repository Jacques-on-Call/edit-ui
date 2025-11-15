import { h } from 'preact';
import './EditorHeader.css';

/**
 * EditorHeader
 * - On mobile we hide the Publish button (bottom toolbar has Publish)
 * - Provide compact toggles for Blocks/Inspector on mobile (icons)
 */
export default function EditorHeader({ title, onPublish, isSaving, activeTab, onTabSwitch, onToggleBlocks, onToggleInspector, isMobile }) {
  console.log('[EditorHeader] render - title:', title, 'activeTab:', activeTab, 'isSaving:', isSaving, 'isMobile:', !!isMobile);
  return (
    <header className="editor-header">
      <div className="left">
        {/* On mobile, we prefer a compact top-left back (or hide) and surface Home in bottom bar */}
        <button className="btn-plain" onClick={() => { console.log('[EditorHeader] back clicked'); window.history.back(); }} aria-label="Back">Back</button>
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="center">
        {/* hide tabs on very small screens; keep accessible via header on larger mobile/tablet */}
        {!isMobile && (
          <nav className="tabs" role="tablist" aria-label="Editor tabs">
            <button className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => onTabSwitch('content')}>Content</button>
            <button className={`tab ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => onTabSwitch('visual')}>Visual</button>
          </nav>
        )}
      </div>

      <div className="right">
        {isMobile && (
          <>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] blocks toggle clicked'); onToggleBlocks && onToggleBlocks(); }} title="Blocks">☰</button>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] inspector toggle clicked'); onToggleInspector && onToggleInspector(); }} title="Inspect">⚙</button>
          </>
        )}

        <span className="saving-indicator" aria-live="polite">{isSaving ? 'Saving…' : ''}</span>

        {/* Hide the header publish on mobile to avoid duplicate controls */}
        {!isMobile && <button className="btn-primary" onClick={onPublish}>Publish</button>}
      </div>
    </header>
  );
}
