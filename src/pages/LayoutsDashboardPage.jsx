import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewTemplateModal from '../components/NewTemplateModal';
import Icon from '../components/Icon';

const LayoutsDashboardPage = () => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadLayouts() {
      try {
        const [d1Res, astroRes] = await Promise.all([
          fetch("/api/layout-templates"),
          fetch("/api/astro-layouts")
        ]);

        const [d1Raw, astroRaw] = await Promise.all([d1Res.json(), astroRes.json()]);

        // --- Normalization Logic ---
        const normalizeD1 = (item) => ({
          id: item.id?.toString() || crypto.randomUUID(),
          name: item.name || "Untitled Layout",
          source: "d1",
          path: `/layout/${item.id || "unknown"}`,
          json_content: item.json_content || null,
          created_at: item.created_at || null
        });

        const normalizeAstro = (item) => ({
          id: item.path || crypto.randomUUID(),
          name: item.name?.replace(".astro", "") || "Unnamed Astro Layout",
          source: "astro",
          path: item.path || "src/layouts/unknown.astro",
          json_content: null,
          created_at: null
        });

        const extractArray = (data) =>
          Array.isArray(data)
            ? data
            : Array.isArray(data.results)
            ? data.results
            : [];

        const d1Layouts = extractArray(d1Raw).map(normalizeD1);
        const astroLayouts = extractArray(astroRaw).map(normalizeAstro);

        const allLayouts = [...d1Layouts, ...astroLayouts];

        console.log("✅ Normalized Layouts:", allLayouts);
        setLayouts(allLayouts);
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

        {layouts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                <p>🕵️‍♂️ No layouts found yet.</p>
                <p>Try checking your /api/layout-templates or /api/astro-layouts endpoints.</p>
            </div>
        ) : (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "20px",
                    marginTop: "20px"
                }}
            >
                {layouts.map((layout) => {
                    const hasContent = !!layout.json_content;
                    const isAstro = layout.source === "astro";

                    return (
                        <div
                            key={layout.id || layout.path}
                            style={{
                                border: `2px solid ${isAstro ? "#a8dadc" : "#457b9d"}`,
                                borderRadius: "8px",
                                background: hasContent ? "#f8f9fa" : "#fff4e6",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                position: "relative"
                            }}
                        >
                            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em" }}>
                                {layout.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9em", color: "#555" }}>
                                Source:{" "}
                                <strong
                                    style={{
                                        color: isAstro ? "#1d3557" : "#e76f51",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    {layout.source}
                                </strong>
                            </p>
                            <p style={{ margin: "4px 0", fontSize: "0.85em", color: "#777" }}>
                                Path: <code>{layout.path}</code>
                            </p>

                            {layout.created_at && (
                                <p style={{ fontSize: "0.8em", color: "#888" }}>
                                    Created: {new Date(layout.created_at).toLocaleString()}
                                </p>
                            )}

                            <div
                                style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    fontSize: "0.75em",
                                    color: hasContent ? "#2a9d8f" : "#e76f51"
                                }}
                            >
                                {hasContent ? "✅ Content Found" : "⚠️ Missing Content"}
                            </div>

                            <button
                                style={{
                                    marginTop: "12px",
                                    width: "100%",
                                    background: "#457b9d",
                                    color: "white",
                                    padding: "8px 0",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                                onClick={() =>
                                    navigate(`/layout-editor?id=${encodeURIComponent(layout.path || layout.id)}`)
                                }
                            >
                                Open Layout
                            </button>
                        </div>
                    );
                })}
                {layouts.length > 0 && (
                    <div
                        style={{
                            border: "2px dashed #ccc",
                            borderRadius: "8px",
                            padding: "16px",
                            textAlign: "center",
                            color: "#777",
                            background: "#fafafa"
                        }}
                    >
                        <p>🪄 Need a new layout?</p>
                        <button
                            style={{
                                background: "#1d3557",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                            onClick={() => navigate("/layout-editor?new=true")}
                        >
                            + Create New Layout
                        </button>
                    </div>
                )}
            </div>
        )}

        {isModalOpen && <NewTemplateModal onClose={() => setModalOpen(false)} onSubmit={handleCreateNewTemplate} />}
    </div>
);
};

export default LayoutsDashboardPage;