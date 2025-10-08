import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Page } from './render/Page';
import { EditorSection } from './Section.editor';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutEditorInner = ({ templateName, templateId, initialJson }) => {
  const { actions, query } = useEditor();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialJson) {
      actions.deserialize(initialJson);
    }
  }, [initialJson, actions]);

  const saveLayout = async () => {
    const json = query.serialize();
    try {
      const response = await fetch(`/api/layout-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
        body: JSON.stringify({ json_content: json, name: templateName }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Template '${templateName}' saved successfully!`);
        // If this was a new template, update the URL to use its new ID
        if (!templateId && data.template_id) {
          navigate(`/layout-editor?template_id=${data.template_id}`, { replace: true });
        }
      } else {
        throw new Error(data.error || 'Failed to save layout template');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 overflow-auto">
        <Frame json={initialJson}>
          <Page />
        </Frame>
      </div>
      <Sidebar saveLayout={saveLayout} />
    </div>
  );
}

export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName);

  useEffect(() => {
    // If we have an ID, we are editing an existing template.
    if (templateId) {
      setLoading(true);
      const fetchLayoutTemplate = async () => {
        try {
          const response = await fetch(`/api/layout-templates?template_id=${templateId}`, { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            setInitialJson(data.json_content); // The API now returns an object with name and json_content
            setCurrentTemplateName(data.name);
          } else {
            throw new Error(`Failed to fetch layout template: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Fetch error:', error);
          alert(`Error loading layout: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchLayoutTemplate();
    }
    // If we only have a name, it's a new template.
    else if (templateName) {
      setCurrentTemplateName(templateName);
      setInitialJson(null); // Start with a blank canvas
      setLoading(false);
    }
    // If we have neither, we can't proceed.
    else {
      setLoading(false);
    }
  }, [templateId, templateName]);

  if (!templateId && !templateName) {
    return <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">No Template Specified</h2>
        <p>To create a new template, please go back to the File Explorer and use the "New Layout" button.</p>
        <button onClick={() => navigate('/explorer')} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded">
            Go to Explorer
        </button>
    </div>;
  }

  if (loading) {
    return <div className="p-8 animate-pulse">Loading Editor...</div>;
  }

  return (
    <Editor
      resolver={{
        Page,
        EditorSection
      }}
    >
      <LayoutEditorInner templateName={currentTemplateName} templateId={templateId} initialJson={initialJson} />
    </Editor>
  );
};