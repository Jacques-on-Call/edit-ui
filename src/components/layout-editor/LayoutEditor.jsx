import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
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

const LayoutEditorInner = ({ onSave, initialJson }) => {
  const { actions } = useEditor();

  useEffect(() => {
    if (initialJson && actions) {
      // The `actions.deserialize` function is what loads the saved JSON state into the editor.
      actions.deserialize(initialJson);
    }
  }, [initialJson, actions]);

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 overflow-auto">
        <Frame json={initialJson}>
          <Page />
        </Frame>
      </div>
      <Sidebar onSave={onSave} />
    </div>
  );
};

export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName);

  const { query: editorQuery } = useEditor();

  useEffect(() => {
    if (templateId) {
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
      // Set a default empty state for a new layout to prevent the editor from crashing.
      const defaultState = {
        "ROOT": {
          "type": { "resolvedName": "Page" },
          "isCanvas": true,
          "props": {
            "style": { "width": "100%", "minHeight": "100vh", "backgroundColor": "#ffffff" }
          },
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
  }, [templateId, templateName]);

  const handleSave = async () => {
    const json = editorQuery.serialize();
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

  if (loading) return <div className="p-8 animate-pulse">Loading Editor...</div>;

  if (!templateId && !templateName) {
    return <div className="p-8 text-center">...</div>;
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
      <LayoutEditorInner onSave={handleSave} initialJson={initialJson} />
    </Editor>
  );
};