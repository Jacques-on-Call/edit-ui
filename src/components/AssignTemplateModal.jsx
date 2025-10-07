import React, { useState, useEffect } from 'react';

const AssignTemplateModal = ({ file, onClose, onAssign }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/layout-templates', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch layout templates');
        }
        const data = await response.json();
        setTemplates(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleAssign = () => {
    if (selectedTemplate) {
      onAssign(file, selectedTemplate);
    }
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
        <h2 className="text-xl font-bold mb-2">Assign Layout Template</h2>
        <p className="text-gray-600 mb-6">
          Choose a layout template to apply to the file: <span className="font-semibold text-gray-800">{file.name}</span>
        </p>

        {loading && <div className="text-center p-4">Loading templates...</div>}
        {error && <div className="text-center p-4 text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
            {templates.length > 0 ? (
              templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${selectedTemplate === template.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className={`text-sm ${selectedTemplate === template.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    Last updated: {new Date(template.updated_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No layout templates found.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedTemplate || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTemplateModal;