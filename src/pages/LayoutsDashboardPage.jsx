import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';

const LayoutsDashboardPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/layout-templates', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch layout templates: ${response.statusText}`);
      }
      const data = await response.json();
      // Defensively ensure that we always set an array to prevent render crashes
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNewTemplate = (templateName) => {
    const encodedName = encodeURIComponent(templateName);
    navigate(`/layout-editor?template_name=${encodedName}`);
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
                <Link
                  to={`/layout-editor?template_id=${template.id}`}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Edit
                </Link>
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