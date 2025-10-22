import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { compileAstro } from '../../lib/layouts/compileAstro';
import { validateAstroLayout } from '../../lib/layouts/validateAstro';
import ImportsEditor from './ImportsEditor';
import PropsEditor from './PropsEditor';
import HtmlAttrsEditor from './HtmlAttrsEditor';
import HeadEditor from './HeadEditor';
import RegionsEditor from './RegionsEditor';
import PreviewPane from './PreviewPane';

// A blueprint that replicates MainLayout.astro for new layouts.
const emptyBlueprint = {
  name: "New Layout",
  htmlAttrs: { lang: "en" },
  imports: [
    { as: "Header", from: "src/components/Header.astro" },
    { as: "Footer", from: "src/components/Footer.astro" },
  ],
  props: {
    title: { type: "string", default: "Site Title" },
    description: { type: "string", default: "" },
  },
  head: [
    { type: "meta", attrs: { charset: "utf-8" } },
    { type: "meta", attrs: { name: "viewport", content: "width=device-width, initial-scale=1" } },
    { type: "title", contentFromProp: "title" },
  ],
  preContent: [
    { type: "component", name: "Header" }
  ],
  contentSlot: { name: "Content", single: true },
  postContent: [
    { type: "component", name: "Footer" }
  ],
};

// --- UI Components for different parts of the blueprint ---

const Section = ({ title, children }) => (
  <div className="bg-slate-800 rounded-lg p-4 mb-4">
    <h2 className="text-lg font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const TextAreaInput = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-blue-500 focus:border-blue-500 font-mono"
    />
  </div>
);

const LayoutModeEditor = ({ initialBlueprint, filePath, fileSha }) => {
  const [blueprint, setBlueprint] = useState(initialBlueprint || emptyBlueprint);
  const [currentSha, setCurrentSha] = useState(fileSha);

  useEffect(() => {
    if (initialBlueprint) {
      setBlueprint(initialBlueprint);
    }
  }, [initialBlueprint]);

  const filename = filePath?.split('/').pop();

  const handleBlueprintChange = (key, value) => {
    setBlueprint(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const astroCode = compileAstro(blueprint);

    // --- SAVE GUARDRAIL ---
    const { ok, errors } = validateAstroLayout(astroCode);
    if (!ok) {
      alert(`Validation failed:\n- ${errors.join('\n- ')}`);
      return;
    }

    const repo = localStorage.getItem('selectedRepo');
    if (!repo || !filePath) {
      alert('Missing repository or file path information.');
      return;
    }

    try {
      const response = await fetch('/api/save-layout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          path: filePath,
          branch: localStorage.getItem('selectedBranch') || 'main',
          content: astroCode, // raw
          sha: fileSha, // Pass the sha for updates
          message: `feat: update layout ${filePath} via new editor`
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const latestFile = await response.json();
          const userConfirmed = window.confirm(
            "The file has been modified on the server since you opened it. Do you want to overwrite the remote changes with your own?"
          );
          if (userConfirmed) {
            setCurrentSha(latestFile.content.sha);
            // Re-call handleSave with the new sha.
            // Note: This could be more robust by creating a separate function.
            const astroCode = compileAstro(blueprint);
            const retryResponse = await fetch('/api/save-layout', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                repo,
                path: filePath,
                branch: localStorage.getItem('selectedBranch') || 'main',
                content: astroCode,
                sha: latestFile.content.sha,
                message: `feat: update layout ${filePath} via new editor (overwrite conflict)`
              }),
            });
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json();
              throw new Error(errorData.message || 'Failed to save layout after conflict.');
            }
          } else {
            return; // User cancelled the overwrite.
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save layout.');
        }
      }

      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  const compiledCode = compileAstro(blueprint);
  const { errors: validationErrors } = validateAstroLayout(compiledCode);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800 shadow-md z-20">
        <Link to="/explorer" className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <Icon name="home" className="text-white" />
        </Link>
        <h1 className="font-semibold text-center truncate">{filename}</h1>
        <button
          onClick={handleSave}
          className="p-2 rounded-md hover:bg-slate-700 transition-colors"
        >
          <Icon name="publish" className="text-white" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Side: Editors */}
          <div className="space-y-6">
            <Section title="Layout Configuration">
              <HtmlAttrsEditor
                value={blueprint.htmlAttrs}
                onChange={(newAttrs) => handleBlueprintChange('htmlAttrs', newAttrs)}
              />
            </Section>
            <Section title="Frontmatter">
              <ImportsEditor
                value={blueprint.imports}
                onChange={(newImports) => handleBlueprintChange('imports', newImports)}
              />
              <PropsEditor
                value={blueprint.props}
                onChange={(newProps) => handleBlueprintChange('props', newProps)}
              />
            </Section>
            <Section title="Head Content">
              <HeadEditor
                value={blueprint.head}
                onChange={(newHead) => handleBlueprintChange('head', newHead)}
              />
            </Section>
            <Section title="Body Content">
              <RegionsEditor
                preContent={blueprint.preContent}
                postContent={blueprint.postContent}
                onPreChange={(newPre) => handleBlueprintChange('preContent', newPre)}
                onPostChange={(newPost) => handleBlueprintChange('postContent', newPost)}
              />
            </Section>
          </div>

          {/* Right Side: Preview */}
          <div>
            <PreviewPane compiledCode={compiledCode} validationErrors={validationErrors} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LayoutModeEditor;
