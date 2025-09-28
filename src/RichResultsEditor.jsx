import React from 'react';
import styles from './RichResultsEditor.module.css';

function RichResultsEditor({ sections, onUpdate }) {

  const handleSectionChange = (sectionIndex, field, value) => {
    const newSections = [...sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
    onUpdate(newSections);
  };

  const handleGridItemChange = (sectionIndex, itemIndex, field, value) => {
    const newSections = [...sections];
    const newItems = [...newSections[sectionIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
    onUpdate(newSections);
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={styles.richResultsEditor}>
        <p>No sections available to edit.</p>
      </div>
    );
  }

  return (
    <div className={styles.richResultsEditor}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className={styles.sectionEditor}>
          <div className={styles.sectionHeader}>
            <h4>Section {sectionIndex + 1}: {section.type}</h4>
          </div>

          {Object.keys(section).map(field => {
            if (field === 'type' || field === 'items') return null; // 'items' handled separately

            const value = section[field];
            if (typeof value === 'string' || typeof value === 'undefined') {
              const isTextArea = field === 'text' || field === 'content' || field === 'description';
              return (
                <div key={field} className={styles.formGroup}>
                  <label htmlFor={`section-${sectionIndex}-${field}`}>{field}</label>
                  {isTextArea ? (
                    <textarea
                      id={`section-${sectionIndex}-${field}`}
                      value={value || ''}
                      onChange={(e) => handleSectionChange(sectionIndex, field, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      id={`section-${sectionIndex}-${field}`}
                      value={value || ''}
                      onChange={(e) => handleSectionChange(sectionIndex, field, e.target.value)}
                    />
                  )}
                </div>
              );
            }
            return null;
          })}

          {section.type === 'grid' && section.items && (
            <div className={styles.gridItemsContainer}>
              <h5>Grid Items</h5>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className={styles.gridItemEditor}>
                  <h6>Item {itemIndex + 1}</h6>
                  {Object.keys(item).map(itemField => (
                    <div key={itemField} className={styles.formGroup}>
                      <label htmlFor={`section-${sectionIndex}-item-${itemIndex}-${itemField}`}>{itemField}</label>
                       <input
                         type="text"
                         id={`section-${sectionIndex}-item-${itemIndex}-${itemField}`}
                         value={item[itemField] || ''}
                         onChange={(e) => handleGridItemChange(sectionIndex, itemIndex, itemField, e.target.value)}
                       />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default RichResultsEditor;