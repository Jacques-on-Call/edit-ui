import React, { useState, useEffect } from 'react';
import './HeadEditor.css';

const HeadEditor = ({ frontmatter, onUpdate, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (frontmatter) {
      setTitle(frontmatter.title || '');
      setDescription(frontmatter.description || '');
    }
  }, [frontmatter]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    onUpdate({ ...frontmatter, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    onUpdate({ ...frontmatter, description: e.target.value });
  };

  if (!frontmatter) return null;

  return (
    <div className="head-editor-overlay">
      <div className="head-editor-modal">
        <div className="head-editor-header">
          <h3>Edit Page Details</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="head-editor-content">
          <div className="form-section">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter page title"
            />
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter meta description for search engines"
              rows="4"
            />
          </div>
          <div className="preview-section">
            <h4>Search Result Preview</h4>
            <div className="search-result-preview">
              <div className="preview-title">{title || 'Your Title Here'}</div>
              <div className="preview-url">www.strategycontent.agency/your-page-slug</div>
              <div className="preview-description">
                {description || 'Your meta description will appear here. Keep it concise and compelling.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadEditor;
