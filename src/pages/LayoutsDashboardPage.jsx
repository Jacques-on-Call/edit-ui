import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';

// Mock data to simulate fetching from an API
const mockTemplates = [
  { id: 1, name: 'Blog Post', updated_at: '2025-10-07T10:00:00Z' },
  { id: 2, name: 'Service Page', updated_at: '2025-10-06T15:30:00Z' },
  { id: 3, name: 'Contact Us', updated_at: '2025-10-05T12:00:00Z' },
];

const LayoutsDashboardPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateNewTemplate = (templateName) => {
    console.log(`Creating new template named: ${templateName}`);
    // In a real implementation, this would navigate to the editor:
    // const encodedName = encodeURIComponent(templateName);
    // navigate(`/layout-editor?template_name=${encodedName}`);
    alert(`(Placeholder) Would create new template: "${templateName}"`);
    setModalOpen(false);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Layouts...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Layout Templates</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all flex items-center space-x-2"
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Create New Template</span>
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {templates.length > 0 ? (
            templates.map(template => (
              <li key={template.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{template.name}</p>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(template.updated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => alert(`(Placeholder) Would navigate to editor for template ID: ${template.id}`)}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Edit
                </button>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-gray-500">
              <p>No layout templates found.</p>
              <p className="mt-2">Click "Create New Template" to get started.</p>
            </li>
          )}
        </ul>
      </div>

      {isModalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onSubmit={handleCreateNewTemplate} />}
    </div>
  );
};

export default LayoutsDashboardPage;