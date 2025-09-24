import React, { useState, useEffect } from 'react';
import './HeadEditor.css';

const TITLE_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 160;

// This is now a controlled component. It receives its values as props and calls
// back to the parent on every change. It no longer holds its own state for title/desc.
const HeadEditor = ({
    title = '',
    description = '',
    frontmatter,
    onUpdate,
    onClose,
    path,
    sections,
    onSlugUpdate
}) => {

  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (path) {
      const pathParts = path.split('/');
      const filename = pathParts.pop();
      setSlug(filename.substring(0, filename.lastIndexOf('.')) || filename);
    }
  }, [path]);

  const handleTitleChange = (e) => {
    onUpdate({ ...frontmatter, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    onUpdate({ ...frontmatter, description: e.target.value });
  };

  const handleSlugChange = (e) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    setSlug(newSlug);
    onSlugUpdate(newSlug);
  };

  if (!frontmatter) return null;

  return (
    <div className="head-editor-overlay">
      <div className="head-editor-modal">
        <div className="head-editor-header">
          <h2>Search Preview & Settings</h2>
        </div>
        <div className="head-editor-content">
          {/* Preview Section */}
          <div className="preview-section">
            <h4>Search Result Preview</h4>
            <div className="search-result-preview">
              <div className="preview-title">{title || 'Your Title Here'}</div>
              <div className="preview-url">www.strategycontent.agency/{slug || 'your-page-slug'}</div>
              <div className="preview-description">{description || 'Your meta description will appear here. Keep it concise and compelling.'}</div>
            </div>
          </div>

          {/* Metadata Section */}
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

          {/* Settings Section */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="slug">URL Slug</label>
              <p className="form-group-description">This is the very last part of the URL. It should be short, descriptive, and contain keywords.</p>
              <input id="slug" type="text" value={slug} onChange={handleSlugChange} placeholder="your-page-slug" />
            </div>
          </div>
        </div>
        <div className="head-editor-footer">
            <button onClick={onClose} className="done-button">Done</button>
        </div>
      </div>
    </div>
  );
};

export default HeadEditor;
