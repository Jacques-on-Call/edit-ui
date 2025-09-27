import React from 'react';
import styles from './VisualSectionPreview.module.css';

const VisualSectionPreview = ({ section }) => {
  const renderPreview = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className={styles.previewContent}>
            <h2>{section.title || 'Hero Title'}</h2>
            <p>{section.subtitle || 'Hero subtitle...'}</p>
          </div>
        );
      case 'grid':
        return (
          <div className={styles.previewContent}>
            <h3>{section.title || 'Grid Section'}</h3>
            <p className={styles.itemCount}>({(section.items || []).length} items)</p>
          </div>
        );
      case 'cta':
        return (
          <div className={`${styles.previewContent} ${styles.ctaPreview}`}>
            <button className={styles.ctaButtonPreview} disabled>
              {(section.buttons && section.buttons[0]?.text) || 'Call to Action'}
            </button>
          </div>
        );
      default:
        return <p>Unsupported section type: {section.type}</p>;
    }
  };

  return (
    <div className={styles.visualSectionPreview}>
      <div className={styles.previewHeader}>
        <strong>{section.type.replace('_', ' ')}</strong>
        <span className={styles.previewTag}>(Preview - Not Editable)</span>
      </div>
      {renderPreview()}
    </div>
  );
};

export default VisualSectionPreview;