import React from 'react';

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
      <div className="flex flex-col gap-6">
        <p>No sections available to edit.</p>
      </div>
    );
  }

  const formGroupClasses = "mb-4";
  const labelClasses = "block font-semibold text-sm mb-2 text-gray-800";
  const inputClasses = "w-full p-2 border border-gray-300 rounded text-sm";
  const textareaClasses = `${inputClasses} min-h-[80px] resize-y`;

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <h4 className="m-0 text-sm font-bold text-gray-500 uppercase tracking-wider">
              Section {sectionIndex + 1}: {section.type}
            </h4>
          </div>

          {Object.keys(section).map((field) => {
            if (field === 'type' || field === 'items') return null;

            const value = section[field];
            if (typeof value === 'string' || typeof value === 'undefined') {
              const isTextArea = field === 'text' || field === 'content' || field === 'description';
              return (
                <div key={field} className={formGroupClasses}>
                  <label htmlFor={`section-${sectionIndex}-${field}`} className={labelClasses}>
                    {field}
                  </label>
                  {isTextArea ? (
                    <textarea
                      id={`section-${sectionIndex}-${field}`}
                      value={value || ''}
                      onChange={(e) => handleSectionChange(sectionIndex, field, e.target.value)}
                      className={textareaClasses}
                    />
                  ) : (
                    <input
                      type="text"
                      id={`section-${sectionIndex}-${field}`}
                      value={value || ''}
                      onChange={(e) => handleSectionChange(sectionIndex, field, e.target.value)}
                      className={inputClasses}
                    />
                  )}
                </div>
              );
            }
            return null;
          })}

          {section.type === 'grid' && section.items && (
            <div className="mt-4">
              <h5 className="text-md font-bold mb-2">Grid Items</h5>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border-l-4 border-blue pl-4 mt-4 pt-4 border-t border-gray-200">
                  <h6 className="font-semibold mb-2">Item {itemIndex + 1}</h6>
                  {Object.keys(item).map((itemField) => (
                    <div key={itemField} className={formGroupClasses}>
                      <label htmlFor={`section-${sectionIndex}-item-${itemIndex}-${itemField}`} className={labelClasses}>
                        {itemField}
                      </label>
                      <input
                        type="text"
                        id={`section-${sectionIndex}-item-${itemIndex}-${itemField}`}
                        value={item[itemField] || ''}
                        onChange={(e) => handleGridItemChange(sectionIndex, itemIndex, itemField, e.target.value)}
                        className={inputClasses}
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