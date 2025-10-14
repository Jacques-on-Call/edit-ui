import React, { useState, useEffect } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { LayoutEditorHeader } from './LayoutEditorHeader';
import { Page } from './render/Page';
import { EditorSection } from './Section.editor';
import { EditorHero } from './blocks/Hero.editor';
import { EditorTestimonial } from './blocks/Testimonial.editor';
import { Text } from './blocks/Text.editor';
import DebugSidebar from './visual-renderer/DebugSidebar';
import { parseTestComponent, generateTestComponent } from '../../utils/testParser';
import { TestComponent } from './TestComponent';

const AstroFileNotice = ({ fileName, onClose }) => (
  <div className="absolute top-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md shadow-lg z-50 max-w-sm">
    <div className="flex">
      <div className="py-1">
        <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4H9zm0-6h2v2H9V5z"/></svg>
      </div>
      <div>
        <p className="font-bold">Astro Layout Opened (Read-Only)</p>
        <p className="text-sm">You are viewing a blank canvas. The content of <strong>{fileName}</strong> has been analyzed, but it cannot be edited directly.</p>
        <p className="text-sm mt-2">You can use this canvas to create a new graphical layout template.</p>
      </div>
       <button onClick={onClose} className="ml-4 text-blue-500 hover:text-blue-800 text-2xl font-bold">&times;</button>
    </div>
  </div>
);

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutEditorInner = ({ templateId, currentTemplateName, navigate, initialJson, deserializationError, setDeserializationError }) => {
  const { actions, query, ready, editorState, internalState } = useEditor((state) => ({
    ready: state.events.ready,
    editorState: state.nodes,
    internalState: state, // Get the whole internal state for comparison
  }));
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDebugVisible, setDebugVisible] = useState(false); // Keep debug hidden by default
  const [processedJson, setProcessedJson] = useState(null);

  useEffect(() => {
    if (ready && initialJson) {
      setDeserializationError(null);
      let content;
      try {
        content = initialJson;
        while (typeof content === 'string') {
          content = JSON.parse(content);
        }
        setProcessedJson(content); // Store the fully parsed JSON for the debugger

        if (!content || !content.ROOT) {
          throw new Error("Invalid layout data: 'ROOT' node is missing.");
        }

        actions.deserialize(content);

        // Post-load verification
        setTimeout(() => {
            const b = query.getNodes();
            const nodesLoaded = Object.keys(b).length;
            const nodesExpected = Object.keys(content).length;

            if (nodesLoaded <= 1 && nodesExpected > 1) { // Only ROOT node vs expected nodes
                 setDeserializationError(
                    `Silent failure: Editor rejected the layout. Expected ${nodesExpected} nodes, but only ${nodesLoaded} were loaded. This usually means a component is not registered in the resolver.`
                 );
            }
        }, 100);


      } catch (e) {
        console.error("Error deserializing layout JSON:", e);
        setDeserializationError(e.message);
        setProcessedJson(content || { error: 'Parsing failed before processing' });
        actions.deserialize({
          "ROOT": { "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false, "nodes": [], "linkedNodes": {} }
        });
      }
    }
  }, [ready, initialJson, actions, setDeserializationError, query, internalState]);

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

  const [generatedCode, setGeneratedCode] = useState(null);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <LayoutEditorHeader
        onSave={handleSave}
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onToggleDebug={() => setDebugVisible(!isDebugVisible)}
        isDebugVisible={isDebugVisible}
      />
       <button
        onClick={() => console.log('Generated Code:', generatedCode)}
        className="bg-green-500 text-white p-2 m-2 rounded"
      >
        Generate Code (Log to Console)
      </button>
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
        {isDebugVisible && (
          <DebugSidebar
            report={null} // report is for astro-specific analysis, can be enhanced later
            onClose={() => setDebugVisible(false)}
            initialJson={initialJson}
            processedJson={processedJson}
            deserializationError={deserializationError}
            liveEditorState={editorState}
          />
        )}
      </div>
    </div>
  );
};

export const LayoutEditor = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = query.get('template_id');
  const templateName = query.get('template_name');
  const astroLayoutPath = query.get('path');

  const { templateJson: starterJson, templateName: starterName } = location.state || {};

  const [initialJson, setInitialJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName || starterName);

  const [isAstroLayout, setIsAstroLayout] = useState(!!astroLayoutPath);
  const [deserializationError, setDeserializationError] = useState(null);
  const [astroAnalysis, setAstroAnalysis] = useState({
    report: null,
    errorHtml: null,
    isLoading: true,
    showNotice: false,
  });

  useEffect(() => {
    const defaultState = JSON.stringify({
      "ROOT": { "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false, "nodes": [], "linkedNodes": {} }
    });

    setLoading(true);
    if (astroLayoutPath) {
      setIsAstroLayout(true);
      fetch(`/api/get-file-content?path=${encodeURIComponent(astroLayoutPath)}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
          return res.text();
        })
        .then(content => {
          const parsedData = parseTestComponent(content);
          if (parsedData) {
            setInitialJson(JSON.stringify(parsedData));
            setAstroAnalysis({ report: null, errorHtml: null, isLoading: false, showNotice: false });
          } else {
            // If the parser returns null, it means our component wasn't found.
            // For this test, we'll just load a blank canvas.
            setInitialJson(defaultState);
            setAstroAnalysis({ report: null, errorHtml: null, isLoading: false, showNotice: true });
          }
           setCurrentTemplateName(`Editing: ${astroLayoutPath.split('/').pop()}`);
        })
        .catch(err => {
          console.error("Error loading or parsing file:", err);
          setInitialJson(defaultState);
          setAstroAnalysis({ report: {errors: [err.message]}, errorHtml: null, isLoading: false, showNotice: true });
        });

    } else if (starterJson) {
      setIsAstroLayout(false);
      try {
        JSON.parse(starterJson);
        setInitialJson(starterJson);
        setCurrentTemplateName(starterName);
      } catch (e) {
        console.error("Invalid starter template JSON:", e);
        setInitialJson(null);
      }
      setLoading(false);
    } else if (templateId) {
      setIsAstroLayout(false);
      fetch(`/api/render-layout/${templateId}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
        .then(data => {
          if (!data || !data.json_content) {
             throw new Error("Invalid response from server. `json_content` is missing.");
          }
          setInitialJson(data.json_content);
          setCurrentTemplateName(data.name);
        })
        .catch(err => {
          console.error("Error fetching layout:", err);
          setInitialJson(null);
        })
        .finally(() => setLoading(false));
    } else {
      setIsAstroLayout(false);
      setInitialJson(defaultState);
      setCurrentTemplateName(templateName || "New Layout");
      setLoading(false);
    }
  }, [templateId, starterJson, starterName, templateName, astroLayoutPath]);

  // Combined loading state
  const isPageLoading = isAstroLayout ? astroAnalysis.isLoading : loading;
  if (isPageLoading) return <div className="p-8 animate-pulse">Loading Editor...</div>;

  // Render logic for Astro Layouts
  if (isAstroLayout) {
    if (astroAnalysis.errorHtml) {
      return (
        <div className="flex w-full h-screen">
          <div className="flex-1 relative">
            <iframe srcDoc={astroAnalysis.errorHtml} title={`Error preview for ${astroLayoutPath}`} className="w-full h-full border-none" sandbox="allow-scripts"/>
          </div>
          <DebugSidebar report={astroAnalysis.report} onClose={() => setAstroAnalysis(prev => ({ ...prev, errorHtml: null }))} />
        </div>
      );
    }
    // Render the editor with the imported Astro layout
    return (
        <Editor
          key={astroLayoutPath} // Use path as key to force re-render
          resolver={{ Page, TestComponent, Text }}
          onNodesChange={(q) => {
            const json = q.getNodes();
            const code = generateTestComponent(json);
            setGeneratedCode(code);
          }}
        >
          <LayoutEditorInner templateId={null} currentTemplateName={currentTemplateName} navigate={navigate} initialJson={initialJson} deserializationError={deserializationError} setDeserializationError={setDeserializationError} />
        </Editor>
    );
  }

  // Render logic for D1/Starter Templates
  if (!initialJson) {
    return <div className="p-8 text-center text-red-500">Could not load template data.</div>;
  }

  return (
    <Editor
      key={templateId || templateName}
      resolver={{ Page, EditorSection, EditorHero, EditorTestimonial, Text }}
    >
      <LayoutEditorInner templateId={templateId} currentTemplateName={currentTemplateName} navigate={navigate} initialJson={initialJson} deserializationError={deserializationError} setDeserializationError={setDeserializationError} />
    </Editor>
  );
};
