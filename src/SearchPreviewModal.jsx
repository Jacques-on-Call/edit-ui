import { useState, useEffect } from 'react';
import styles from './SearchPreviewModal.module.css';

// A new sub-component for the visual SERP preview, defined at the top level
function SerpPreview({ title, description, slug }) {
  const siteUrl = `https://www.strategycontent.agency/${slug}`;
  return (
    <div className={styles.serpPreview}>
      <span className={styles.serpUrl}>{siteUrl}</span>
      <h3 className={styles.serpTitle}>{title || 'Your Title Here'}</h3>
      <p className={styles.serpDescription}>{description || 'Your meta description will appear here. Try to keep it under 160 characters.'}</p>
    </div>
  );
}

function SearchPreviewModal({
  initialTitle = '',
  initialDescription = '',
  initialSlug = '',
  initialJsonSchema = {},
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('serp');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [slug, setSlug] = useState(initialSlug);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify(initialJsonSchema, null, 2));

  const handleSave = () => {
    try {
      const parsedJsonSchema = JSON.parse(jsonSchema);
      onSave({ title, description, slug, jsonSchema: parsedJsonSchema });
    } catch (error) {
      alert('The JSON Schema is invalid. Please correct it before saving.');
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Search Preview</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'serp' ? styles.active : ''}`}
            onClick={() => setActiveTab('serp')}
          >
            SERP View
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'json' ? styles.active : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON Schema
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'serp' && (
            <div className={styles.serpTab}>
              <h4>Live Preview</h4>
              <SerpPreview title={title} description={description} slug={slug} />
              <hr className={styles.divider} />

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label htmlFor="meta-title">Meta Title</label>
                  <span className={styles.charCounter}>{title.length} / 60</span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.inputField}
                  maxLength="60"
                />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label htmlFor="meta-description">Meta Description</label>
                  <span className={styles.charCounter}>{description.length} / 160</span>
                </div>
                <textarea
                  id="meta-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textareaField}
                  rows="4"
                  maxLength="160"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="url-slug">URL Slug</label>
                <input
                  id="url-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>
          )}
          {activeTab === 'json' && (
            <div className={styles.jsonTab}>
              <textarea
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
                className={styles.jsonEditor}
                rows="15"
                spellCheck="false"
              />
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default SearchPreviewModal;