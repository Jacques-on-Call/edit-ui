import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { TouchBackend } from 'react-dnd-touch-backend';

import { EditorHeader } from './EditorHeader';
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

// This inner component is rendered within the <Editor> provider's context.
const LayoutEditorInner = ({ templateId, currentTemplateName, navigate }) => {
  const { query } = useEditor();

  const handleSave = async () => {
    const json = query.serialize();
    try {
      const response = await fetch(`/api/layout-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json_content: JSON.parse(json), name: currentTemplateName }),
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
    <div className="flex flex-col h-screen w-full bg-gray-200">
      <EditorHeader onSave={handleSave} />
      <div className="flex-1 overflow-auto">
        <Frame />
      </div>
    </div>
  );
};

// This is the main component that fetches data and sets up the Editor provider.
export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName);

  useEffect(() => {
    if (templateId) {
      setLoading(true);
      fetch(`/api/layout-templates?template_id=${templateId}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          setInitialJson(data.json_content);
          setCurrentTemplateName(data.name);
        })
        .catch(err => console.error("Error fetching layout:", err))
        .finally(() => setLoading(false));
    } else {
      const defaultState = {
        "ROOT": {
          "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {},
          "displayName": "Page", "custom": {}, "hidden": false, "nodes": [], "linkedNodes": {}
        }
      };
      setInitialJson(JSON.stringify(defaultState));
      setCurrentTemplateName(templateName || 'New Layout');
      setLoading(false);
    }
  }, [templateId, templateName]);

  if (loading) return <div className="p-8 animate-pulse">Loading Editor...</div>;
  if (!initialJson) return <div className="p-8 text-center">Could not load layout.</div>;

  return (
    <Editor
      backend={TouchBackend}
      backendOptions={{ enableMouseEvents: true, touchSlop: 2, ignoreContextMenu: true }}
      resolver={{
        Page, EditorSection, EditorHero, EditorFeatureGrid,
        EditorTestimonial, EditorCTA, EditorFooter,
      }}
      json={initialJson}
    >
      <LayoutEditorInner
        templateId={templateId}
        currentTemplateName={currentTemplateName}
        navigate={navigate}
      />
    </Editor>
  );
};