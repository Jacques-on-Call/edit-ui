import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// ============================================================================
// LAYOUT COMPONENT DEFINITIONS
// ============================================================================

const layoutComponents = {
Header: {
label: 'Header',
props: {
title: 'My Site',
subtitle: '',
variant: 'light'
},
template: (props) => `
<header class="header header--${props.variant}">
  <h1>${props.title}</h1>
  ${props.subtitle ? `<p>${props.subtitle}</p>` : ''}
</header>`,
    preview: (props) => (
      <div className="bg-gray-100 p-6 border-b-4 border-blue-500">
        <h1 className="text-3xl font-bold">{props.title}</h1>
        {props.subtitle && <p className="text-gray-600">{props.subtitle}</p>}
      </div>
    )
  },

Hero: {
label: 'Hero',
props: {
title: 'Welcome',
description: 'Your description here',
image: '',
cta: 'Get Started',
layout: 'centered'
},
template: (props) => `
<section class="hero hero--${props.layout}">
  ${props.image ? `<img src="${props.image}" alt="hero" class="hero__image" />` : ''}
  <div class="hero__content">
    <h2>${props.title}</h2>
    <p>${props.description}</p>
    <button class="btn btn--primary">${props.cta}</button>
  </div>
</section>`,
    preview: (props) => (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-12">
        <h2 className="text-4xl font-bold mb-4">{props.title}</h2>
        <p className="text-lg mb-6 opacity-90">{props.description}</p>
        <button className="bg-white text-blue-600 px-6 py-2 rounded font-semibold">
          {props.cta}
        </button>
      </div>
    )
  },

FeatureGrid: {
label: 'Feature Grid',
props: {
title: 'Features',
columns: 3,
features: [
{ icon: '⚡', title: 'Fast', description: 'Lightning quick performance' },
{ icon: '🔒', title: 'Secure', description: 'Enterprise grade security' },
{ icon: '📱', title: 'Responsive', description: 'Works on all devices' }
]
},
template: (props) => `
<section class="features">
  <h2>${props.title}</h2>
  <div class="features__grid features__grid--${props.columns}col">
    ${props.features.map(f => `
    <div class="feature">
      <div class="feature__icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
    `).join('')}
  </div>
</section>`,
    preview: (props) => (
      <div className="p-12 bg-gray-50">
        <h2 className="text-3xl font-bold mb-8 text-center">{props.title}</h2>
        <div className={`grid grid-cols-${props.columns} gap-8`}>
          {props.features.map((f, i) => (
            <div key={i} className="p-6 bg-white rounded-lg shadow">
              <div className="text-4xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },

CTA: {
label: 'Call-to-Action',
props: {
title: 'Ready to get started?',
description: 'Join thousands of happy users',
buttonText: 'Sign Up',
buttonLink: '#',
variant: 'dark'
},
template: (props) => `
<section class="cta cta--${props.variant}">
  <div class="cta__content">
    <h2>${props.title}</h2>
    <p>${props.description}</p>
    <a href="${props.buttonLink}" class="btn btn--${props.variant === 'dark' ? 'light' : 'dark'}">
      ${props.buttonText}
    </a>
  </div>
</section>`,
    preview: (props) => (
      <div className={`p-12 text-center ${props.variant === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'}`}>
        <h2 className="text-3xl font-bold mb-2">{props.title}</h2>
        <p className="text-lg mb-6 opacity-75">{props.description}</p>
        <a
          href={props.buttonLink}
          className={`inline-block px-6 py-3 rounded font-semibold ${
            props.variant === 'dark'
              ? 'bg-white text-gray-900'
              : 'bg-gray-900 text-white'
          }`}
        >
          {props.buttonText}
        </a>
      </div>
    )
  },

Footer: {
label: 'Footer',
props: {
company: 'My Company',
year: new Date().getFullYear(),
links: [
{ label: 'About', href: '#' },
{ label: 'Privacy', href: '#' },
{ label: 'Contact', href: '#' }
]
},
template: (props) => `
<footer class="footer">
  <p>&copy; ${props.year} ${props.company}</p>
  <nav class="footer__nav">
    ${props.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
  </nav>
</footer>`,
    preview: (props) => (
      <div className="bg-gray-900 text-white p-6">
        <div className="flex justify-between items-center">
          <p>&copy; {props.year} {props.company}</p>
          <nav className="flex gap-4">
            {props.links.map((l, i) => (
              <a key={i} href={l.href} className="hover:text-gray-300">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    )
  }
};

// ============================================================================
// ASTRO → LAYOUT COMPONENTS PARSER
// ============================================================================

function parseAstroToBlocks(astroCode) {
const blocks = [];

// Simple pattern matching for known components
const patterns = {
Header: /<Header\s+(?:title="([^"]*)")?(?:\s+subtitle="([^"]*)")?(?:\s+variant="([^"]*)")?\s*\/?>/g,
Hero: /<Hero\s+(?:title="([^"]*)")?(?:\s+description="([^"]*)")?(?:\s+cta="([^"]*)")?(?:\s+layout="([^"]*)")?\s*\/?>/g,
FeatureGrid: /<FeatureGrid\s+(?:title="([^"]*)")?(?:\s+columns="([^"]*)")?\s*\/?>/g,
CTA: /<CTA\s+(?:title="([^"]*)")?(?:\s+description="([^"]*)")?(?:\s+buttonText="([^"]*)")?(?:\s+variant="([^"]*)")?\s*\/?>/g,
Footer: /<Footer\s+(?:company="([^"]*)")?(?:\s+year="([^"]*)")?\s*\/?>/g
};

for (const [componentName, pattern] of Object.entries(patterns)) {
let match;
while ((match = pattern.exec(astroCode)) !== null) {
const component = layoutComponents[componentName];
const props = { ...component.props };

  // Extract attributes based on component type
  if (componentName === 'Header') {
    if (match[1]) props.title = match[1];
    if (match[2]) props.subtitle = match[2];
    if (match[3]) props.variant = match[3];
  } else if (componentName === 'Hero') {
    if (match[1]) props.title = match[1];
    if (match[2]) props.description = match[2];
    if (match[3]) props.cta = match[3];
    if (match[4]) props.layout = match[4];
  } else if (componentName === 'FeatureGrid') {
    if (match[1]) props.title = match[1];
    if (match[2]) props.columns = parseInt(match[2]);
  } else if (componentName === 'CTA') {
    if (match[1]) props.title = match[1];
    if (match[2]) props.description = match[2];
    if (match[3]) props.buttonText = match[3];
    if (match[4]) props.variant = match[4];
  } else if (componentName === 'Footer') {
    if (match[1]) props.company = match[1];
    if (match[2]) props.year = match[2];
  }

  blocks.push({ type: componentName, props, id: `${componentName}-${blocks.length}` });
}
}

return blocks;
}

// ============================================================================
// LAYOUT COMPONENTS → ASTRO CODE GENERATOR
// ============================================================================

function generateAstroCode(blocks) {
const imports = `import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import FeatureGrid from '../components/FeatureGrid.astro';
import CTA from '../components/CTA.astro';
import Footer from '../components/Footer.astro';
`;

const layoutBlocks = blocks.map(block => {
const { type, props } = block;
const attrs = Object.entries(props)
.filter(([key]) => key !== 'features') // Skip complex objects for now
.map(([key, value]) => {
if (typeof value === 'string') {
return `${key}="${value}"`;
} else if (typeof value === 'number') {
return `${key}="${value}"`;
}
return '';
})
.filter(Boolean)
.join(' ');

return `<${type}${attrs ? ' ' + attrs : ''} />`;
}).join('\n\n');

return `---
// Auto-generated layout
---

${imports}
<html>
  <head>
    <title>Generated Layout</title>
  </head>
  <body>
    ${layoutBlocks}
  </body>
</html>`;
}

// ============================================================================
// EDITABLE BLOCK COMPONENT
// ============================================================================

function EditableBlock({ block, onUpdate, onRemove }) {
const component = layoutComponents[block.type];
const [isEditing, setIsEditing] = useState(false);

const handlePropChange = (key, value) => {
onUpdate({ ...block, props: { ...block.props, [key]: value } });
};

return (
<div className="border-2 border-gray-300 rounded-lg p-4 mb-4 bg-white">
<div className="flex justify-between items-center mb-3">
<h3 className="font-bold text-lg">{component.label}</h3>
<div className="flex gap-2">
<button
onClick={() => setIsEditing(!isEditing)}
className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
>
{isEditing ? 'Done' : 'Edit'}
</button>
<button
onClick={() => onRemove(block.id)}
className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
>
Remove
</button>
</div>
</div>

  <div className="mb-4 bg-gray-50 rounded border border-gray-200 overflow-hidden">
    {component.preview(block.props)}
  </div>

  {isEditing && (
    <div className="bg-gray-100 p-4 rounded">
      {Object.entries(block.props).map(([key, value]) => {
        if (key === 'features') return null;
        if (typeof value === 'object') return null;

        return (
          <div key={key} className="mb-3">
            <label className="block text-sm font-semibold mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            {typeof value === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) => handlePropChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handlePropChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  )}
</div>
);
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const fromPath = searchParams.get('from');
  const repo = localStorage.getItem('selectedRepo');

  const [blocks, setBlocks] = useState([]);
  const [astroInput, setAstroInput] = useState('');
  const [generatedAstro, setGeneratedAstro] = useState('');
  const [activeTab, setActiveTab] = useState('builder');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!filePath || !repo) {
      setError('Cannot save without file path and repository information.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const contentToSave = generatedAstro || astroInput;
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(contentToSave))),
          message: `feat: update layout ${filePath}`
        }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An unknown error occurred during save.');
      }
      console.log('Save successful!');
      if (fromPath) {
        navigate(`/editor?path=${fromPath}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchLayoutContent = async () => {
      if (!filePath || !repo) {
        setError('Missing file path or repository information.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
        const data = await res.json();
        const binaryString = atob(data.content.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decodedContent = new TextDecoder('utf-8').decode(bytes);
        setAstroInput(decodedContent);
        setActiveTab('input'); // Switch to the input tab to show the loaded code
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutContent();
  }, [repo, filePath]);

  const handleParseAstro = () => {
const parsed = parseAstroToBlocks(astroInput);
setBlocks(parsed);
setActiveTab('builder');
};

const handleGenerateAstro = () => {
setGeneratedAstro(generateAstroCode(blocks));
setActiveTab('output');
};

const handleAddBlock = (type) => {
const component = layoutComponents[type];
setBlocks([
...blocks,
{
type,
props: { ...component.props },
id: `${type}-${Date.now()}`
}
]);
};

const handleUpdateBlock = (updated) => {
setBlocks(blocks.map(b => b.id === updated.id ? updated : b));
};

const handleRemoveBlock = (id) => {
setBlocks(blocks.filter(b => b.id !== id));
};

  if (loading) {
    return <div className="text-center p-12 text-white">Loading layout...</div>;
  }

  if (error) {
    return <div className="text-center p-12 text-red-400 bg-slate-800">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Semantic Layout Editor</h1>
          <p className="text-gray-300">Editing: <code className="bg-slate-700 p-1 rounded">{filePath}</code></p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR */}
          <div className="col-span-3 bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Components</h2>
        <div className="space-y-2">
          {Object.entries(layoutComponents).map(([key, comp]) => (
            <button
              key={key}
              onClick={() => handleAddBlock(key)}
              className="w-full text-left px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              + {comp.label}
            </button>
          ))}
        </div>

        <hr className="my-6 border-slate-700" />

        <h2 className="text-lg font-bold mb-4">Actions</h2>
        <button
          onClick={handleGenerateAstro}
          disabled={blocks.length === 0}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition font-semibold mb-2"
        >
          Generate Astro
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded transition font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save & Return'}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="col-span-9">
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'builder'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Layout Builder
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'input'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Import Astro
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'output'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Export
          </button>
        </div>

        {/* BUILDER TAB */}
        {activeTab === 'builder' && (
          <div className="bg-slate-800 rounded-lg p-6">
            {blocks.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                Add components from the sidebar to get started
              </p>
            ) : (
              <div>
                {blocks.map((block) => (
                  <EditableBlock
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdateBlock}
                    onRemove={handleRemoveBlock}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="bg-slate-800 rounded-lg p-6">
            <textarea
              value={astroInput}
              onChange={(e) => setAstroInput(e.target.value)}
              placeholder="Paste Astro code here..."
              className="w-full h-96 p-4 bg-slate-900 text-white font-mono rounded border border-slate-600 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleParseAstro}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
            >
              Parse & Load
            </button>
          </div>
        )}

        {/* OUTPUT TAB */}
        {activeTab === 'output' && (
          <div className="bg-slate-800 rounded-lg p-6">
            {generatedAstro ? (
              <>
                <textarea
                  value={generatedAstro}
                  readOnly
                  className="w-full h-96 p-4 bg-slate-900 text-white font-mono rounded border border-slate-600 resize-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedAstro)}
                  className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold transition"
                >
                  Copy to Clipboard
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-center py-12">
                Generate Astro code to see it here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
);
}
