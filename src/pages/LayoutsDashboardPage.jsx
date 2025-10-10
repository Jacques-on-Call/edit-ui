import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';

const LayoutsDashboardPage = () => {
  const [d1Layouts, setD1Layouts] = useState([]);
  const [astroLayouts, setAstroLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadLayouts() {
      setLoading(true);
      setError(null);
      try {
        const selectedRepo = localStorage.getItem('selectedRepo');
        if (!selectedRepo) {
          throw new Error("No repository selected. Please select a repository first.");
        }

        const [d1Res, astroRes] = await Promise.all([
          fetch("/api/layout-templates", { credentials: 'include' }),
          fetch(`/api/astro-layouts?repo=${selectedRepo}`, { credentials: 'include' })
        ]);

        if (!d1Res.ok) throw new Error(`Failed to fetch D1 templates: ${d1Res.statusText}`);
        if (!astroRes.ok) throw new Error(`Failed to fetch Astro layouts: ${astroRes.statusText}`);

        const [d1Raw, astroRaw] = await Promise.all([d1Res.json(), astroRes.json()]);

        // --- Normalization Logic ---
        const normalizeD1 = (item) => ({
          id: item.id?.toString() || `d1-${crypto.randomUUID()}`,
          name: item.name || "Untitled D1 Layout",
          source: "d1",
          path: `/layout-editor?template_id=${item.id}`,
          json_content: item.json_content || null, // Will be null for list view
          created_at: item.updated_at || item.created_at || null
        });

        const normalizeAstro = (item) => ({
          id: item.path || `astro-${crypto.randomUUID()}`,
          name: item.name?.replace(".astro", "") || "Unnamed Astro Layout",
          source: "astro",
          path: `/layout-editor?repo=${selectedRepo}&path=${encodeURIComponent(item.path)}`,
          json_content: null,
          created_at: null
        });

        const extractArray = (data) =>
          Array.isArray(data)
            ? data
            : Array.isArray(data.results)
            ? data.results
            : [];

        const finalD1Layouts = extractArray(d1Raw).map(normalizeD1);
        const finalAstroLayouts = extractArray(astroRaw)
          .filter(item => item.name && item.name.endsWith('.astro'))
          .map(normalizeAstro);

        setD1Layouts(finalD1Layouts);
        setAstroLayouts(finalAstroLayouts);

        console.log("✅ D1 Layouts:", finalD1Layouts);
        console.log("✅ Astro Layouts:", finalAstroLayouts);

      } catch (err) {
        console.error("❌ Failed to load layouts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadLayouts();
  }, []);

  const handleCreateNewTemplate = (template) => {
    setModalOpen(false);
    if (template.json) {
      navigate('/layout-editor', {
        state: {
          templateJson: template.json,
          templateName: template.name,
          isStarter: true
        }
      });
    } else {
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

      {d1Layouts.length === 0 && astroLayouts.length === 0 && !loading ? (
         <div className="text-center p-10 bg-white rounded-lg shadow-md">
           <h3 className="text-xl font-semibold text-gray-700">🕵️‍♂️ No layouts found.</h3>
           <p className="text-gray-500 mt-2">This space is ready for your designs. Click "Create New Template" to start.</p>
         </div>
      ) : (
        <>
          {/* D1 Graphical Templates */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4 border-b pb-2">Graphical Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {d1Layouts.map((layout) => (
                <LayoutCard key={layout.id} layout={layout} />
              ))}
              <div
                onClick={() => setModalOpen(true)}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 cursor-pointer text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <Icon name="plus" className="h-8 w-8 mb-2" />
                <span className="font-bold text-center">Create New Template</span>
              </div>
            </div>
          </div>

          {/* Astro File-based Layouts */}
          {astroLayouts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4 border-b pb-2">File-based Layouts (src/layouts)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {astroLayouts.map((layout) => (
                  <LayoutCard key={layout.id} layout={layout} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onSubmit={handleCreateNewTemplate} />}
    </div>
  );
};

const LayoutCard = ({ layout }) => {
  const isAstro = layout.source === "astro";
  const hasContent = !!layout.json_content;

  return (
    <div
      key={layout.id}
      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${isAstro ? "border-blue-300" : "border-purple-300"}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-800 truncate pr-2">{layout.name}</h3>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isAstro ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            {layout.source.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate" title={layout.path}>
          <code>{layout.path}</code>
        </p>

        <div className="text-xs text-gray-400 mt-2">
          {layout.created_at ? `Updated: ${new Date(layout.created_at).toLocaleDateString()}` : "No date"}
        </div>

        {!isAstro && (
          <div className={`mt-3 text-sm font-semibold flex items-center ${hasContent ? "text-green-600" : "text-amber-600"}`}>
            {hasContent ? '✅' : '⚠️'}
            <span className="ml-1.5">{hasContent ? "Content Ready" : "Missing Content"}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3">
        <Link
          to={layout.path}
          className="w-full text-center block bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Open
        </Link>
      </div>
    </div>
  );
};

export default LayoutsDashboardPage;