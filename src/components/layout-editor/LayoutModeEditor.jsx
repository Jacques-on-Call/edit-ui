import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { compileAstro } from '../../lib/layouts/compileAstro';
import { validateAstroLayout } from '../../lib/layouts/validateAstro';

// A blueprint that replicates MainLayout.astro for new layouts.
const emptyBlueprint = {
  name: "New Layout",
  htmlAttrs: { lang: "en" },
  imports: [
    { as: "Header", from: "../components/Header.astro" },
    { as: "Footer", from: "../components/Footer.astro" },
  ],
  props: {
    title: { type: "string", default: "Site" },
  },
  head: [
    { type: 'raw', html: '    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />' },
    { type: 'title', contentFromProp: 'title' }
  ],
  preContent: [{ type: 'component', name: 'Header' }],
  contentSlot: { name: 'Content', single: true },
  postContent: [{ type: 'component', name: 'Footer' }],
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

const LayoutModeEditor = ({ initialBlueprint, filePath }) => {
  const [blueprint, setBlueprint] = useState(initialBlueprint || emptyBlueprint);

  useEffect(() => {
    if (initialBlueprint) {
      setBlueprint(initialBlueprint);
    }
  }, [initialBlueprint]);

  const filename = filePath?.split('/').pop();

  const handleBlueprintChange = (key, value) => {
    setBlueprint(prev => ({ ...prev, [key]: value }));
  };

  // Helper to handle raw text -> BodyNode[] conversion
  const handleBodyNodeChange = (key, rawText) => {
      const nodes = rawText.trim() ? [{ type: 'raw', html: rawText }] : [];
      handleBlueprintChange(key, nodes);
  }

  // Helper to handle imports text -> ImportSpec[]
  const handleImportsChange = (rawText) => {
      const imports = rawText.split('\n').filter(Boolean).map(line => {
          const match = line.match(/import\s+(.*)\s+from\s+['"](.*)['"]/);
          return match ? { as: match[1], from: match[2] } : null;
      }).filter(Boolean);
      handleBlueprintChange('imports', imports);
  }

  // Helper to handle JSON props -> PropSpec
  const handlePropsChange = (rawText) => {
      try {
          const props = JSON.parse(rawText);
          handleBlueprintChange('props', props);
      } catch (e) {
          console.error("Invalid JSON for props");
      }
  }

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
          message: `feat: update layout ${filePath} via new editor`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save layout.');
      }

      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  // Convert blueprint parts to string for text areas
  const importsText = blueprint.imports.map(i => `import ${i.as} from "${i.from}";`).join('\n');
  const propsText = JSON.stringify(blueprint.props, null, 2);
  const preContentText = blueprint.preContent.map(n => n.html || '').join('\n');
  const postContentText = blueprint.postContent.map(n => n.html || '').join('\n');
  const htmlAttrsText = JSON.stringify(blueprint.htmlAttrs, null, 2);

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
        <div className="max-w-4xl mx-auto">
            <Section title="Layout Configuration">
               <TextAreaInput
                    label="HTML Attributes (JSON)"
                    value={htmlAttrsText}
                    onChange={(e) => {
                        try {
                           handleBlueprintChange('htmlAttrs', JSON.parse(e.target.value))
                        } catch {}
                    }}
                />
            </Section>

            <Section title="Frontmatter">
                <TextAreaInput
                    label="Imports"
                    value={importsText}
                    onChange={(e) => handleImportsChange(e.target.value)}
                />
                <TextAreaInput
                    label="Props (JSON)"
                    value={propsText}
                    onChange={(e) => handlePropsChange(e.target.value)}
                />
            </Section>

            <Section title="Body Content">
                 <TextAreaInput
                    label="Pre-Content Region (Before Slot)"
                    value={preContentText}
                    onChange={(e) => handleBodyNodeChange('preContent', e.target.value)}
                />
                <div className="text-center my-4 p-4 border border-dashed border-slate-600 rounded-md">
                    <p className="text-slate-400 font-medium">&lt;slot /&gt;</p>
                    <p className="text-xs text-slate-500">Content from pages will be injected here.</p>
                </div>

                 <TextAreaInput
                    label="Post-Content Region (After Slot)"
                    value={postContentText}
                    onChange={(e) => handleBodyNodeChange('postContent', e.target.value)}
                />
            </Section>
        </div>
      </main>
    </div>
  );
};

export default LayoutModeEditor;
