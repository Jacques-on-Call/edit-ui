import React, { useState } from 'react';
import { starterTemplates } from '../utils/starter-templates';

const NewTemplateModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');

  const handleBlankSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      // Submit an object with only the name for a blank template
      onSubmit({ name: name.trim() });
    }
  };

  const handleTemplateSelect = (template) => {
    // Submit the full template object when a starter is selected
    onSubmit(template);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Create New Layout</h2>
            <p className="text-gray-600 mb-6">Start with a blank canvas or choose a template.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* Option 1: Blank Canvas */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">Blank Canvas</h3>
          <p className="text-sm text-gray-500 mb-4">Give your new layout a name to start from scratch.</p>
          <form onSubmit={handleBlankSubmit} className="flex space-x-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Custom Layout"
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Create
            </button>
          </form>
        </div>

        {/* Option 2: Starter Templates */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Start from a Template</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {starterTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => handleTemplateSelect(template)}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-blue-100 border transition-colors"
              >
                <p className="font-semibold text-gray-800">{template.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTemplateModal;