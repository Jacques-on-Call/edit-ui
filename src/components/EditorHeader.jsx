import { h } from 'preact';
import './EditorHeader.css';

export default function EditorHeader({ title, onPublish, isSaving, activeTab, onTabSwitch, onToggleBlocks, onToggleInspector, isMobile }) {
  console.log('[EditorHeader] render - title:', title, 'activeTab:', activeTab, 'isSaving:', isSaving, 'isMobile:', !!isMobile);
  return (
    <header className="editor-header">
      <div className="left">
        <button className="btn-plain" onClick={() => { console.log('[EditorHeader] back clicked'); window.history.back(); }}>Back</button>
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="center">
        <nav className="tabs" role="tablist" aria-label="Editor tabs">
          <button className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => onTabSwitch('content')}>Content</button>
          <button className={`tab ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => onTabSwitch('visual')}>Visual</button>
        </nav>
      </div>

      <div className="right">
        {/* Mobile: compact toggles for drawers */}
        {isMobile && (
          <>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] blocks toggle clicked'); onToggleBlocks && onToggleBlocks(); }} title="Blocks">☰</button>
            <button className="btn-icon" onClick={() => { console.log('[EditorHeader] inspector toggle clicked'); onToggleInspector && onToggleInspector(); }} title="Inspect">⚙</button>
          </>
        )}
        <span className="saving-indicator">{isSaving ? 'Saving…' : ''}</span>
        <button className="btn-primary" onClick={onPublish}>Publish</button>
      </div>
    </header>
  );
}
