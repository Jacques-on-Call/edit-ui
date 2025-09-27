import React, { useState, useEffect } from 'react';
import styles from './HeadEditor.module.css';

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
  const [activeTab, setActiveTab] = useState('meta');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label htmlFor="slug">URL Slug</label>
              <p className={styles.formGroupDescription}>This is the very last part of the URL. It should be short, descriptive, and contain keywords.</p>
              <input id="slug" type="text" value={slug} onChange={handleSlugChange} placeholder="your-page-slug" />
            </div>
          </div>
        );
      case 'meta':
      default:
        return (
          <>
            <div className={styles.previewSection}>
              <h4>Search Result Preview</h4>
              <div className={styles.searchResultPreview}>
                <div className={styles.previewTitle}>{title || 'Your Title Here'}</div>
                <div className={styles.previewUrl}>www.strategycontent.agency/{slug || 'your-page-slug'}</div>
                <div className={styles.previewDescription}>{description || 'Your meta description will appear here. Keep it concise and compelling.'}</div>
              </div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label htmlFor="title">SEO Title</label>
                <input id="title" type="text" value={title} onChange={handleTitleChange} placeholder="The title that appears in search results" maxLength={TITLE_MAX_LENGTH + 10} />
                <span className={`${styles.charCounter} ${title.length > TITLE_MAX_LENGTH ? styles.overLimit : ''}`}>{title.length}/{TITLE_MAX_LENGTH}</span>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Meta Description</label>
                <textarea id="description" value={description} onChange={handleDescriptionChange} placeholder="A brief summary for search results" rows="4" maxLength={DESC_MAX_LENGTH + 20} />
                <span className={`${styles.charCounter} ${description.length > DESC_MAX_LENGTH ? styles.overLimit : ''}`}>{description.length}/{DESC_MAX_LENGTH}</span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className={styles.headEditorOverlay}>
      <div className={styles.headEditorModal}>
        <div className={styles.headEditorHeader}>
          <div className={styles.tabs}>
            <button className={`${styles.tabButton} ${activeTab === 'meta' ? styles.active : ''}`} onClick={() => setActiveTab('meta')}>Meta & Preview</button>
            <button className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>
        </div>
        <div className={styles.headEditorContent}>
          {renderContent()}
        </div>
        <div className={styles.headEditorFooter}>
            <button onClick={onClose} className={styles.doneButton}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default HeadEditor;
