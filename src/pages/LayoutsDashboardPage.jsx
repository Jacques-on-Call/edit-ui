import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';

const LayoutsDashboardPage = () => {
  const [templates, setTemplates] = useState([]);
  const [astroLayouts, setAstroLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllLayouts = async () => {
      try {
        setLoading(true);
        const selectedRepo = localStorage.getItem('selectedRepo');
        if (!selectedRepo) {
          throw new Error("No repository selected. Please select a repository first.");
        }

        // Fetch both D1 templates and Astro layouts in parallel
        const [templatesResponse, astroLayoutsResponse] = await Promise.all([
          fetch('/api/layout-templates', { credentials: 'include' }),
          fetch(`/api/astro-layouts?repo=${selectedRepo}`, { credentials: 'include' })
        ]);

        if (!templatesResponse.ok) {
          throw new Error(`Failed to fetch layout templates: ${templatesResponse.statusText}`);
        }
        if (!astroLayoutsResponse.ok) {
          throw new Error(`Failed to fetch Astro layouts: ${astroLayoutsResponse.statusText}`);
        }

        const templatesData = await templatesResponse.json();
        const astroLayoutsData = await astroLayoutsResponse.json();

        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        setAstroLayouts(Array.isArray(astroLayoutsData) ? astroLayoutsData : []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLayouts();
  }, []);

  const handleCreateNewTemplate = (template) => {
    setModalOpen(false);
    if (template.json) {
      // If it's a starter template, pass the data via state
      navigate('/layout-editor', {
        state: {
          templateJson: template.json,
          templateName: template.name,
          isStarter: true
        }
      });
    } else {
      // If it's a blank template, just pass the name in the URL
      const encodedName = encodeURIComponent(template.name);
      navigate(`/layout-editor?template_name=${encodedName}`);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Layouts...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Layouts</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all flex items-center space-x-2"
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Graphical Templates Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-700">Graphical Templates</h2>
            <p className="text-sm text-gray-500">Editable drag-and-drop layouts.</p>
        </div>
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
              <p>No graphical templates found.</p>
              <p className="mt-2">Click "Create New Template" to get started.</p>
            </li>
          )}
        </ul>
      </div>

      {/* Astro File-based Layouts Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-700">Astro File-based Layouts</h2>
            <p className="text-sm text-gray-500">Base layouts from your repository. Click to open in the graphical editor.</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {astroLayouts.length > 0 ? (
            astroLayouts.map(layout => (
              <li key={layout.path} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{layout.name}</p>
                  <p className="text-sm text-gray-500">{layout.path}</p>
                </div>
                <Link
                  to={`/layout-editor?repo=${localStorage.getItem('selectedRepo')}&path=${encodeURIComponent(layout.path)}`}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Edit
                </Link>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-gray-500">
              <p>No Astro layouts found in <code>/src/layouts</code>.</p>
            </li>
          )}
        </ul>
      </div>

      {isModalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onSubmit={handleCreateNewTemplate} />}
    </div>
  );
};

export default LayoutsDashboardPage;