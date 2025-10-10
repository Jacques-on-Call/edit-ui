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
import { checkLayoutIntegrity } from '../../utils/layoutIntegrityLogger';
import VisualRenderer from './visual-renderer/VisualRenderer';
import DebugSidebar from './visual-renderer/DebugSidebar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutEditorInner = ({ templateId, currentTemplateName, navigate, initialJson }) => {
  const { actions, query, ready } = useEditor((state) => ({ ready: state.events.ready }));
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (ready && initialJson) {
      try {
        actions.deserialize(initialJson);
      } catch (e) {
        console.error("Error deserializing layout JSON:", e);
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
  const [astroFileContent, setAstroFileContent] = useState(null);
  const [debugReport, setDebugReport] = useState(null);

  useEffect(() => {
    setLoading(true);
    const defaultState = JSON.stringify({
      "ROOT": { "type": { "resolvedName": "Page" }, "isCanvas": true, "props": {}, "displayName": "Page", "custom": {}, "hidden": false, "nodes": [], "linkedNodes": {} }
    });

    if (astroLayoutPath) {
      setIsAstroLayout(true);
      fetch(`/api/get-file-content?path=${encodeURIComponent(astroLayoutPath)}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch file content: ${res.statusText}`);
          return res.text();
        })
        .then(content => {
          setAstroFileContent(content);
        })
        .catch(err => {
          console.error(err);
          setAstroFileContent(null); // Explicitly set to null on error
        })
        .finally(() => setLoading(false));

    } else if (starterJson) {
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
      fetch(`/api/layout-templates?template_id=${templateId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then(data => {
          console.group(`[Layout Integrity Report] for Template ID: ${templateId}`);
          const report = checkLayoutIntegrity(data.json_content);
          if (report.isValid) {
            console.log("✅ Layout data is valid.");
          } else {
            console.error("❌ Layout data is invalid. Errors:", report.errors);
          }
          if (report.warnings.length > 0) {
            console.warn("⚠️ Warnings:", report.warnings);
          }
          console.groupEnd();

          setInitialJson(data.json_content);
          setCurrentTemplateName(data.name);
        })
        .catch(err => {
          console.error("Error fetching layout:", err);
          setInitialJson(null);
        })
        .finally(() => setLoading(false));
    } else {
      setInitialJson(defaultState);
      setCurrentTemplateName(templateName || "New Layout");
      setLoading(false);
    }
  }, [templateId, starterJson, starterName, templateName, astroLayoutPath]);

  if (loading) return <div className="p-8 animate-pulse">Loading Editor...</div>;

  if (isAstroLayout) {
    if (!astroFileContent) {
      return <div className="p-8 text-center text-red-500">Could not load Astro layout file.</div>;
    }
    return (
      <div className="flex w-full h-screen">
        <div className="flex-1">
          <VisualRenderer
            fileContent={astroFileContent}
            filePath={astroLayoutPath}
            onError={setDebugReport}
          />
        </div>
        {debugReport && !debugReport.ready && debugReport.errors && debugReport.errors.length > 0 && (
          <DebugSidebar
            report={debugReport}
            onClose={() => setDebugReport(null)}
          />
        )}
      </div>
    );
  }

  if (!initialJson) {
     return <div className="p-8 text-center text-red-500">Could not load template data.</div>;
  }

  return (
    <Editor
      key={templateId || templateName}
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
        initialJson={initialJson}
      />
    </Editor>
  );
};