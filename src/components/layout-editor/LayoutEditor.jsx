import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

// --- New Imports ---
import { Sidebar } from './Sidebar';
import { LayoutEditorHeader } from './LayoutEditorHeader';
import { LayoutDebugger } from './LayoutDebugger';
import { parseAstroToCraft, generateAstroFromCraft } from '../../utils/layoutComponentParser';

// --- Foundational User Components ---
import { Page } from './render/Page'; // Keep Page as it's a good root container
import { Header } from './user-components/Header';
import { Footer } from './user-components/Footer';
import { MainContent } from './user-components/MainContent';
import { Text } from './user-components/Text';


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// This inner component now focuses purely on rendering and saving.
const LayoutEditorInner = ({ templateId, currentTemplateName, navigate, initialJson }) => {
  const { actions, query, ready } = useEditor((state) => ({
    ready: state.events.ready,
  }));

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Effect to load the initial layout data into the editor
  useEffect(() => {
    if (ready && initialJson) {
      try {
        let content = initialJson;
        // Handle double-encoded JSON
        while (typeof content === 'string') {
          content = JSON.parse(content);
        }
        if (!content || !content.ROOT) {
          throw new Error("Invalid layout data: 'ROOT' node is missing.");
        }
        actions.deserialize(content);
      } catch (e) {
        console.error("Error deserializing layout JSON:", e);
        // On error, load a blank canvas
        actions.deserialize({
          "ROOT": { "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "nodes": [] }
        });
      }
    }
  }, [ready, initialJson, actions]);

  // Handler for saving D1 templates (graphical layouts)
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
      // If it's a new template, update URL to reflect its new ID
      if (!templateId && data.template_id) {
        navigate(`/layout-editor?template_id=${data.template_id}`, { replace: true });
      }
    } catch (error) {
      console.error(`Save error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      {/* The debugger will be rendered outside, so we reduce the main view height */}
      <div className="flex-grow flex flex-col">
        <LayoutEditorHeader
          onSave={handleSave}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onToggleDebug={() => {}} // Debugger is always visible now
          isDebugVisible={true}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="craftjs-renderer flex-1 overflow-auto">
            {/* The main editor canvas */}
            <Frame />
          </div>
          {/* Sidebar for components */}
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
    </div>
  );
};


export const LayoutEditor = () => {
  const queryParams = useQuery();
  const navigate = useNavigate();
  const location = useLocation();

  // Get identifiers from URL or state
  const templateId = queryParams.get('template_id');
  const astroLayoutPath = queryParams.get('path');
  const { templateJson: starterJson, templateName: starterName } = location.state || {};

  // State for the debugger and editor flow
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(starterName || "New Layout");
  const [initialJson, setInitialJson] = useState(null); // The JSON to load into the editor

  // --- New State for the Debugger ---
  const [astroInput, setAstroInput] = useState(''); // Raw .astro file content
  const [craftJson, setCraftJson] = useState(null); // Parsed Craft.js JSON
  const [generatedAstro, setGeneratedAstro] = useState(''); // Output from the generator

  // Main effect to load data from different sources
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const defaultState = { "ROOT": { "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "nodes": [] } };

      if (astroLayoutPath) {
        // --- NEW ASTRO PARSING FLOW ---
        try {
          const res = await fetch(`/api/get-file-content?path=${encodeURIComponent(astroLayoutPath)}`, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
          const content = await res.text();

          setAstroInput(content); // 1. Set input for debugger

          const parsedData = parseAstroToCraft(content); // 2. Parse the content
          setCraftJson(parsedData); // 3. Set parsed JSON for debugger

          setInitialJson(JSON.stringify(parsedData)); // 4. Load editor with the new data
          setCurrentTemplateName(`Editing: ${astroLayoutPath.split('/').pop()}`);
        } catch (err) {
          console.error("Error processing Astro file:", err);
          setAstroInput(`// Error loading file: ${astroLayoutPath}\n\n${err.message}`);
          setCraftJson({ error: err.message });
          setInitialJson(JSON.stringify(defaultState)); // Load blank canvas on error
        }

      } else if (starterJson) {
        // --- D1/Starter Template Flow (unchanged) ---
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
        // --- Blank Canvas Flow ---
        setInitialJson(JSON.stringify(defaultState));
        setCurrentTemplateName("New Blank Layout");
      }
      setLoading(false);
    };

    loadData();
  }, [templateId, astroLayoutPath, starterJson, starterName]);

  if (loading) {
    return <div className="p-8 animate-pulse text-center">Loading Layout Editor...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
       {/* The Editor itself takes up the top part of the screen */}
      <div className="flex-grow">
        <Editor
            // Use a key to force re-initialization when the source changes
            key={templateId || astroLayoutPath || 'new'}
            // --- UPDATED RESOLVER ---
            resolver={{ Page, Header, Footer, MainContent, Text }}
            onNodesChange={(q) => {
                // Real-time generation for the debugger
                const newJson = q.getNodes();
                const newAstro = generateAstroFromCraft(newJson);
                setCraftJson(newJson); // Update the live JSON view
                setGeneratedAstro(newAstro); // Update the generated output view
            }}
        >
            <LayoutEditorInner
                templateId={templateId}
                currentTemplateName={currentTemplateName}
                navigate={navigate}
                initialJson={initialJson}
            />
        </Editor>
      </div>

      {/* The Debugger is fixed to the bottom */}
      <div className="flex-shrink-0">
          <LayoutDebugger
            astroInput={astroInput}
            craftJson={craftJson}
            generatedAstro={generatedAstro}
          />
      </div>
    </div>
  );
};