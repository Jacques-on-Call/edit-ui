import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import SaveAsModal from '../SaveAsModal';
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
const LayoutEditorInner = ({ templateId, currentTemplateName, isStarter, navigate, onNameUpdate }) => {
  const { query } = useEditor();
  const [isSaveAsModalOpen, setSaveAsModalOpen] = useState(false);

  const performSave = async (name) => {
    const json = query.serialize();
    try {
      const response = await fetch(`/api/layout-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json_content: JSON.parse(json), name }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save.');

      console.log(`Template '${name}' saved successfully!`);
      // After a successful save, navigate to the new, permanent URL for the template
      navigate(`/layout-editor?template_id=${data.template_id}`, { replace: true });
    } catch (error) {
      console.error(`Save error: ${error.message}`);
    }
  };

  const handleSave = () => {
    // If it's a starter template that hasn't been saved yet (no ID), open the 'Save As' modal.
    if (isStarter && !templateId) {
      setSaveAsModalOpen(true);
    } else {
      performSave(currentTemplateName);
    }
  };

  const handleConfirmSaveAs = async (newName) => {
    setSaveAsModalOpen(false);
    onNameUpdate(newName); // Update the name in the parent component for future saves
    await performSave(newName);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row h-screen w-full bg-gray-100">
        <div className="flex-1 overflow-auto">
          <Frame />
        </div>
        <Sidebar onSave={handleSave} />
      </div>
      {isSaveAsModalOpen && (
        <SaveAsModal
          onClose={() => setSaveAsModalOpen(false)}
          onSubmit={handleConfirmSaveAs}
          initialName={currentTemplateName}
        />
      )}
    </>
  );
};

// This is the main component that fetches data and sets up the Editor provider.
export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');

  const { templateJson: starterJson, templateName: starterName, isStarter } = location.state || {};

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName || starterName);

  useEffect(() => {
    if (isStarter && starterJson) {
      setInitialJson(starterJson);
      setLoading(false);
    } else if (templateId) {
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
  }, [templateId, templateName, isStarter, starterJson]);

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
      json={initialJson}
    >
      <LayoutEditorInner
        templateId={templateId}
        currentTemplateName={currentTemplateName}
        isStarter={isStarter}
        navigate={navigate}
        onNameUpdate={setCurrentTemplateName}
      />
    </Editor>
  );
};