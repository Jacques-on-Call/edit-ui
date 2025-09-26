import React from 'react';
import './VisualSectionPreview.css';

const VisualSectionPreview = ({ section }) => {
  const renderPreview = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="preview-content">
            <h2>{section.title || 'Hero Title'}</h2>
            <p>{section.subtitle || 'Hero subtitle...'}</p>
          </div>
        );
      case 'grid':
        return (
          <div className="preview-content">
            <h3>{section.title || 'Grid Section'}</h3>
            <p className="item-count">({(section.items || []).length} items)</p>
          </div>
        );
      case 'cta':
        return (
          <div className="preview-content cta-preview">
            <button className="cta-button-preview" disabled>
              {(section.buttons && section.buttons[0]?.text) || 'Call to Action'}
            </button>
          </div>
        );
      default:
        return <p>Unsupported section type: {section.type}</p>;
    }
  };

  return (
    <div className="visual-section-preview">
      <div className="preview-header">
        <strong>{section.type.replace('_', ' ')}</strong>
        <span className="preview-tag">(Preview - Not Editable)</span>
      </div>
      {renderPreview()}
    </div>
  );
};

export default VisualSectionPreview;