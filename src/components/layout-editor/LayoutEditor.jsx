import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { LayoutEditorHeader } from './LayoutEditorHeader';
import { Page } from './render/Page';
import { EditorSection } from './Section.editor';
import { EditorHero } from './blocks/Hero.editor';
import { EditorFeatureGrid } from './blocks/FeatureGrid.editor';
import { EditorTestimonial } from './blocks/Testimonial.editor';
import { EditorCTA } from './blocks/CTA.editor';
import { EditorFooter } from './blocks/Footer.editor';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutEditorInner = ({ templateId, currentTemplateName, navigate, json }) => {
  const { query, actions } = useEditor();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // When the initial JSON content changes (e.g., a new template is loaded),
  // deserialize it into the editor state to update the canvas.
  useEffect(() => {
    if (json) {
      actions.deserialize(json);
    }
  }, [json, actions]);

  const handleSave = async () => {
    const json = query.serialize();
    try {
      const response = await fetch(`/api/layout-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json_content: json, name: currentTemplateName }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save.');

      console.log(`Template '${currentTemplateName}' saved successfully!`);

      if (!templateId && data.template_id) {
        navigate(`/layout-editor?template_id=${data.template_id}`, { replace: true });
      }
    } catch (error) {
      console.error(`Save error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <LayoutEditorHeader onSave={handleSave} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas */}
        <div className="craftjs-renderer flex-1 overflow-auto">
          <Frame />
        </div>

        {/* Sidebar for Desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Sidebar Drawer for Mobile */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// This is the main component that fetches data and sets up the Editor provider.
export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');

  const { templateJson: starterJson, templateName: starterName } = location.state || {};

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName || starterName);

  useEffect(() => {
    console.log("LayoutEditor useEffect triggered.", { templateId, templateName, starterJson, starterName, locationState: location.state });
    if (starterJson) {
      console.log("Loading from starter template:", starterName);
      try {
        // Ensure it's valid JSON before setting
        JSON.parse(starterJson);
        setInitialJson(starterJson);
        setCurrentTemplateName(starterName);
      } catch (e) {
        console.error("Invalid starter template JSON:", e);
      }
      setLoading(false);
    } else if (templateId) {
      console.log("Fetching template by ID:", templateId);
      setLoading(true);
      fetch(`/api/layout-templates?template_id=${templateId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then(data => {
          setInitialJson(data.json_content);
          setCurrentTemplateName(data.name);
        })
        .catch(err => console.error("Error fetching layout:", err))
        .finally(() => setLoading(false));
    } else if (templateName) {
      setCurrentTemplateName(templateName);
      const defaultState = {
        "ROOT": {
          "type": { "resolvedName": "Page" },
          "isCanvas": true,
          "props": { "style": { "width": "100%", "minHeight": "100vh", "backgroundColor": "#ffffff" } },
          "displayName": "Page",
          "custom": {},
          "hidden": false,
          "nodes": [],
          "linkedNodes": {}
        }
      };
      setInitialJson(JSON.stringify(defaultState));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [templateId, templateName, starterJson, starterName]);

  if (loading) return <div className="p-8 animate-pulse">Loading Editor...</div>;

  if (!initialJson) {
     return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <Editor
      resolver={{
        Page,
        EditorSection,
        EditorHero,
        EditorFeatureGrid,
        EditorTestimonial,
        EditorCTA,
        EditorFooter,
      }}
    >
      <LayoutEditorInner
        templateId={templateId}
        currentTemplateName={currentTemplateName}
        navigate={navigate}
        json={initialJson}
      />
    </Editor>
  );
};