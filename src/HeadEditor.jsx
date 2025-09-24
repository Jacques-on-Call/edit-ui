import React, { useState, useEffect } from 'react';
import './HeadEditor.css';

const TITLE_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 160;

const HeadEditor = ({ frontmatter, onUpdate, onClose, path, sections, onSectionUpdate, onSlugUpdate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (frontmatter) {
      setTitle(frontmatter.title || '');
      setDescription(frontmatter.description || '');
    }
    if (path) {
      const pathParts = path.split('/');
      const filename = pathParts.pop();
      setSlug(filename.substring(0, filename.lastIndexOf('.')) || filename);
    }
  }, [frontmatter, path]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    onUpdate({ ...frontmatter, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    onUpdate({ ...frontmatter, description: e.target.value });
  };

  const handleSlugChange = (e) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    setSlug(newSlug);
    onSlugUpdate(newSlug);
  };

  // This function is no longer needed as section settings are removed.
  // const handleSectionFieldChange = (index, fieldName, value) => { ... };

  if (!frontmatter) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'metadata':
        return (
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="title">SEO Title</label>
              <input id="title" type="text" value={title} onChange={handleTitleChange} placeholder="The title that appears in search results" maxLength={TITLE_MAX_LENGTH + 10} />
              <span className={`char-counter ${title.length > TITLE_MAX_LENGTH ? 'over-limit' : ''}`}>{title.length}/{TITLE_MAX_LENGTH}</span>
            </div>
            <div className="form-group">
              <label htmlFor="description">Meta Description</label>
              <textarea id="description" value={description} onChange={handleDescriptionChange} placeholder="A brief summary for search results" rows="4" maxLength={DESC_MAX_LENGTH + 20} />
              <span className={`char-counter ${description.length > DESC_MAX_LENGTH ? 'over-limit' : ''}`}>{description.length}/{DESC_MAX_LENGTH}</span>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="slug">URL Slug</label>
              <p className="form-group-description">This is the very last part of the URL. It should be short, descriptive, and contain keywords.</p>
              <input id="slug" type="text" value={slug} onChange={handleSlugChange} placeholder="your-page-slug" />
            </div>
          </div>
        );
      case 'preview':
      default:
        return (
          <div className="preview-section">
            <h4>Search Result Preview</h4>
            <div className="search-result-preview">
              <div className="preview-title">{title || 'Your Title Here'}</div>
              <div className="preview-url">www.strategycontent.agency/{slug || 'your-page-slug'}</div>
              <div className="preview-description">{description || 'Your meta description will appear here. Keep it concise and compelling.'}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="head-editor-overlay">
      <div className="head-editor-modal">
        <div className="head-editor-header">
          <div className="tabs">
            <button className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Preview</button>
            <button className={`tab-button ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}>Metadata</button>
            <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>
        </div>
        <div className="head-editor-content">
          {renderContent()}
        </div>
        <div className="head-editor-footer">
            <button onClick={onClose} className="done-button">Done</button>
        </div>
      </div>
    </div>
  );
};

export default HeadEditor;
