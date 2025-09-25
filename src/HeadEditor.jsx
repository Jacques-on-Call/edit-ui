import React, { useState, useEffect } from 'react';
import './HeadEditor.css';

const TITLE_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 160;

// This component is now fully controlled. It receives its data via props
// and calls the onUpdate callback with a key and value on any change.
const HeadEditor = ({
    title = '',
    description = '',
    onUpdate,
    onClose,
    path,
    onSlugUpdate
}) => {
  const [slug, setSlug] = useState('');
  const [activeTab, setActiveTab] = useState('meta');

  useEffect(() => {
    if (path) {
      const pathParts = path.split('/');
      const filename = pathParts.pop();
      setSlug(filename.substring(0, filename.lastIndexOf('.')) || filename);
    }
  }, [path]);

  const handleFieldChange = (e) => {
    onUpdate(e.target.name, e.target.value);
  };

  const handleSlugChange = (e) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    setSlug(newSlug);
    if (onSlugUpdate) {
        onSlugUpdate(newSlug);
    }
  };

  const renderMetaTab = () => (
    <>
      <div className="preview-section">
        <h4>Search Result Preview</h4>
        <div className="search-result-preview">
          <div className="preview-title">{title || 'Your Title Here'}</div>
          <div className="preview-url">www.strategycontent.agency/{slug || 'your-page-slug'}</div>
          <div className="preview-description">{description || 'Your meta description will appear here.'}</div>
        </div>
      </div>
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="title">SEO Title</label>
          <input id="title" name="title" type="text" value={title} onChange={handleFieldChange} placeholder="Title for search results" maxLength={TITLE_MAX_LENGTH + 10} />
          <span className={`char-counter ${title.length > TITLE_MAX_LENGTH ? 'over-limit' : ''}`}>{title.length}/{TITLE_MAX_LENGTH}</span>
        </div>
        <div className="form-group">
          <label htmlFor="description">Meta Description</label>
          <textarea id="description" name="description" value={description} onChange={handleFieldChange} placeholder="Summary for search results" rows="3" maxLength={DESC_MAX_LENGTH + 20} />
          <span className={`char-counter ${description.length > DESC_MAX_LENGTH ? 'over-limit' : ''}`}>{description.length}/{DESC_MAX_LENGTH}</span>
        </div>
      </div>
    </>
  );

  const renderSettingsTab = () => (
    <div className="form-section">
      <div className="form-group">
        <label htmlFor="slug">URL Slug</label>
        <p className="form-group-description">The last part of the URL. Should be short, descriptive, and contain keywords.</p>
        <input id="slug" type="text" value={slug} onChange={handleSlugChange} placeholder="your-page-slug" />
      </div>
    </div>
  );

  return (
    <div className="head-editor-overlay">
      <div className="head-editor-modal">
        <div className="head-editor-header">
          <div className="tabs">
            <button className={`tab-button ${activeTab === 'meta' ? 'active' : ''}`} onClick={() => setActiveTab('meta')}>Meta & Preview</button>
            <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>
        </div>
        <div className="head-editor-content">
          {activeTab === 'meta' ? renderMetaTab() : renderSettingsTab()}
        </div>
        <div className="head-editor-footer">
          <button onClick={onClose} className="done-button">Done</button>
        </div>
      </div>
    </div>
  );
};

export default HeadEditor;