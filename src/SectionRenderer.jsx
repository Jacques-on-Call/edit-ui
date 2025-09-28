import React from 'react';
import { marked } from 'marked';
import styles from './VisualSectionPreview.module.css';

// A simple, recursive component to render content elements
const renderContent = (content) => {
  if (!content) return null;
  if (typeof content === 'string') {
    // Ensure that content is treated as markdown for consistent rendering
    return <div dangerouslySetInnerHTML={{ __html: marked(content) }} />;
  }
  return null;
};

// --- Main Renderer for a clean, document-like preview ---

function SectionRenderer({ sections }) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return <p>This file does not contain any content sections to display.</p>;
  }

  return (
    <div className={styles.visualSectionPreview}>
      {sections.map((section, index) => {
        // Render each section as a simple series of elements, providing a clean document flow.
        return (
          <div key={index}>
            {section.title && <h1>{section.title}</h1>}
            {section.subtitle && <h2>{section.subtitle}</h2>}
            {section.heading && <h2>{section.heading}</h2>}

            {renderContent(section.content)}
            {renderContent(section.text)}

            {section.image && <img src={section.image} alt={section.imageAlt || section.title || ''} />}

            {/* For 'grid' type, render items linearly without borders or boxes */}
            {section.type === 'grid' && section.items && section.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {item.title && <h3>{item.title}</h3>}
                {item.image && <img src={item.image} alt={item.title || ''} />}
                {renderContent(item.text)}
              </div>
            ))}

            {/* For 'cta' type, render buttons as simple styled links */}
            {section.type === 'cta' && section.buttons && (
              <div style={{ marginTop: '1em' }}>
                {section.buttons.map((button, buttonIndex) => (
                  <p key={buttonIndex}>
                    <a href={button.url}>{button.text}</a>
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SectionRenderer;