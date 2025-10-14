import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { LayoutEditorHeader } from './LayoutEditorHeader';

// --- New AST-based Imports ---
import { parseAstroToCraftJson } from '../../utils/astroAstParser';
import { GenericElement } from './generic-components/GenericElement';
import { TextNode } from './generic-components/TextNode';


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// The inner component remains mostly the same, focusing on rendering and saving.
const LayoutEditorInner = ({ templateId, currentTemplateName, navigate, initialJson }) => {
  const { actions, query, ready } = useEditor((state) => ({
    ready: state.events.ready,
  }));

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (ready && initialJson) {
      try {
        let content = initialJson;
        while (typeof content === 'string') {
          content = JSON.parse(content);
        }
        if (!content || !content.ROOT) {
          throw new Error("Invalid layout data: 'ROOT' node is missing.");
        }
        actions.deserialize(content);
      } catch (e) {
        console.error("Error deserializing layout JSON:", e);
        actions.deserialize({
          "ROOT": { "type": { "resolvedName": "GenericElement" }, "isCanvas": true, "props": {tag: 'div'}, "displayName": "Root", "nodes": [] }
        });
      }
    }
  }, [ready, initialJson, actions]);

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
      if (!templateId && data.template_id) {
        navigate(`/layout-editor?template_id=${data.template_id}`, { replace: true });
      }
    } catch (error) {
      console.error(`Save error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <LayoutEditorHeader
        onSave={handleSave}
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onToggleDebug={() => {}} // Debugger will be added later
        isDebugVisible={false}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="craftjs-renderer flex-1 overflow-auto">
          <Frame />
        </div>
        <div className="hidden md:block">
          <Sidebar />
        </div>
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


import { parse } from '@astrojs/compiler'; // Import parse to generate AST for the debugger
import { LayoutAstDebugger } from './LayoutAstDebugger';
import { generateAstroFromCraftJson } from '../../utils/astroAstParser';


export const LayoutEditor = () => {
  const queryParams = useQuery();
  const navigate = useNavigate();
  const location = useLocation();

  const templateId = queryParams.get('template_id');
  const astroLayoutPath = queryParams.get('path');
  const { templateJson: starterJson, templateName: starterName } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(starterName || "New Layout");
  const [initialJson, setInitialJson] = useState(null);

  // --- New State for the Debugger ---
  const [astroInput, setAstroInput] = useState('');
  const [ast, setAst] = useState(null);
  const [craftJson, setCraftJson] = useState(null);
  const [generatedAstro, setGeneratedAstro] = useState(''); // For later

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const defaultState = { "ROOT": { "type": { "resolvedName": "GenericElement" }, "isCanvas": true, "props": {tag: 'div'}, "displayName": "Root", "nodes": [] }};

      if (astroLayoutPath) {
        try {
          const res = await fetch(`/api/get-file-content?path=${encodeURIComponent(astroLayoutPath)}`, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
          const content = await res.text();

          setAstroInput(content); // 1. Set input for debugger

          const { ast: parsedAst } = await parse(content);
          setAst(parsedAst); // 2. Set AST for debugger

          const parsedData = await parseAstroToCraftJson(content);
          setCraftJson(parsedData); // 3. Set Craft JSON for debugger

          setInitialJson(JSON.stringify(parsedData));
          setCurrentTemplateName(`Editing: ${astroLayoutPath.split('/').pop()}`);
        } catch (err) {
          console.error("Error processing Astro file:", err);
          setAstroInput(`// Error loading file: ${astroLayoutPath}\n\n${err.message}`);
          setAst({ error: err.message });
          setCraftJson({ error: 'See AST for details' });
          setInitialJson(JSON.stringify(defaultState));
        }

      } else if (starterJson) {
        setInitialJson(starterJson);
        setCurrentTemplateName(starterName);
      } else if (templateId) {
        try {
          const res = await fetch(`/api/render-layout/${templateId}`, { credentials: 'include' });
          const data = await res.json();
          if (!data || !data.json_content) throw new Error("Invalid response from server.");
          setInitialJson(data.json_content);
          setCurrentTemplateName(data.name);
        } catch (err) {
          console.error("Error fetching layout:", err);
          setInitialJson(JSON.stringify(defaultState));
        }
      } else {
        setInitialJson(JSON.stringify(defaultState));
        setCurrentTemplateName("New Blank Layout");
      }
      setLoading(false);
    };

    loadData();
  }, [templateId, astroLayoutPath, starterJson, starterName]);

  if (loading || !initialJson) {
    return <div className="p-8 animate-pulse text-center">Loading Layout Editor...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-grow">
        <Editor
          key={templateId || astroLayoutPath || 'new'}
          resolver={{ GenericElement, TextNode }}
          onNodesChange={(q) => {
            const newCraftJson = q.getNodes();
            setCraftJson(newCraftJson);
            const newAstro = generateAstroFromCraftJson(newCraftJson);
            setGeneratedAstro(newAstro);
          }}
        >
          <LayoutEditorInner
            templateId={templateId}
            currentTemplateName={currentTemplateName}
            navigate={navigate}
            initialJson={initialJson}
            onGenerateCode={() => {
              // A simple way to show the generated code for now
              alert("Generated Astro Code:\n\n" + generatedAstro);
            }}
          />
        </Editor>
      </div>
      <div className="flex-shrink-0">
        <LayoutAstDebugger
          astroInput={astroInput}
          ast={ast}
          craftJson={craftJson}
          generatedAstro={generatedAstro}
        />
      </div>
    </div>
  );
};
