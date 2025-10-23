import React from 'react';
import { updateCssVar } from '../utils/previewBridge';
import { v4 as uuidv4 } from 'uuid';

export default function VisualSidebar({ blueprint, setBlueprint, onSave, onSaveAsLayout, previewIframe }) {
  if (!blueprint) {
    return (
      <div className="bg-white w-80 p-4 border-l border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Layout Settings</h2>
        <p className="text-gray-500">Loading layout...</p>
      </div>
    );
  }

  const handleHtmlAttrChange = (attr, value) => {
    setBlueprint({
      ...blueprint,
      htmlAttrs: {
        ...blueprint.htmlAttrs,
        [attr]: value,
      },
    });
  };

  const handleThemeChange = (key, value) => {
    const newBlueprint = {
      ...blueprint,
      htmlAttrs: {
        ...blueprint.htmlAttrs,
        theme: {
          ...(blueprint.htmlAttrs?.theme || {}),
          [key]: value,
        },
      },
    };
    setBlueprint(newBlueprint);
    return newBlueprint;
  };

  const handleBackgroundColorChange = (color) => {
    handleThemeChange('background', color);
    updateCssVar(previewIframe, '--page-bg', color);
  };

  const handleBackgroundImageChange = () => {
    const imageUrl = prompt('Enter the URL for the background image:');
    if (imageUrl) {
      handleThemeChange('backgroundImage', imageUrl);
      updateCssVar(previewIframe, '--page-bg-image', `url(${imageUrl})`);
    }
  };

  const handleTypographyChange = (scale) => {
    handleThemeChange('typographyScale', scale);
    const scaleMap = { S: '0.9', M: '1.0', L: '1.1' };
    updateCssVar(previewIframe, '--type-scale-multiplier', scaleMap[scale] || '1.0');
  };

  const handleSpacingChange = (spacing) => {
    handleThemeChange('spacing', spacing);
    const spacingMap = { compact: '0.5rem', normal: '1rem', roomy: '2rem' };
    updateCssVar(previewIframe, '--section-spacing', spacingMap[spacing] || '1rem');
  };

  const handleAlignmentChange = (alignment) => {
    handleThemeChange('alignment', alignment);
    updateCssVar(previewIframe, '--section-alignment', alignment);
  };

  const addBlock = (region, type) => {
    const newBlock = { id: uuidv4(), type, props: {} };
    setBlueprint({
      ...blueprint,
      [region]: [...(blueprint[region] || []), newBlock],
    });
  };

  const removeBlock = (region, index) => {
    setBlueprint({
      ...blueprint,
      [region]: blueprint[region].filter((_, i) => i !== index),
    });
  };

  const moveBlock = (region, index, direction) => {
    const newBlocks = [...blueprint[region]];
    const [removed] = newBlocks.splice(index, 1);
    newBlocks.splice(index + direction, 0, removed);
    setBlueprint({
      ...blueprint,
      [region]: newBlocks,
    });
  };


  return (
    <div className="bg-white w-80 p-4 border-l border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Layout Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <input
            type="text"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={blueprint.htmlAttrs?.lang || ''}
            onChange={(e) => handleHtmlAttrChange('lang', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Background</label>
          <div className="mt-1 flex items-center">
            <input
              type="color"
              className="w-8 h-8 border-gray-300 rounded-md"
              value={blueprint.htmlAttrs?.theme?.background || '#ffffff'}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
            />
            <button
              className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              onClick={handleBackgroundImageChange}
            >
              Image
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Typography Scale</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'S' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleTypographyChange('S')}
            >
              S
            </button>
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'M' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleTypographyChange('M')}
            >
              M
            </button>
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'L' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleTypographyChange('L')}
            >
              L
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Section Style</label>
          <div className="mt-1 space-y-2">
            <div>
              <label className="text-xs text-gray-500">Spacing</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.spacing === 'compact' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleSpacingChange('compact')}
                >
                  Compact
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.spacing === 'normal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleSpacingChange('normal')}
                >
                  Normal
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.spacing === 'roomy' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleSpacingChange('roomy')}
                >
                  Roomy
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Alignment</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.alignment === 'left' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleAlignmentChange('left')}
                >
                  Left
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.alignment === 'center' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleAlignmentChange('center')}
                >
                  Center
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Block Library</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => addBlock('preContent', 'Header')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Header</button>
          <button onClick={() => addBlock('postContent', 'Footer')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Footer</button>
          <button onClick={() => addBlock('preContent', 'Heading')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Heading</button>
          <button onClick={() => addBlock('preContent', 'Text')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Text</button>
          <button onClick={() => addBlock('preContent', 'Image')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Image</button>
          <button onClick={() => addBlock('preContent', 'Button')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Button</button>
          <button onClick={() => addBlock('preContent', 'Table')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Table</button>
          <button onClick={() => addBlock('preContent', 'Columns')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Columns</button>
          <button onClick={() => addBlock('preContent', 'Section')} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Section</button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Page Blocks</h3>
        <h4>Pre-Content</h4>
        <ul className="space-y-2">
          {(blueprint.preContent || []).map((block, index) => (
            <li key={block.id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{block.type}</span>
              <div className="space-x-1">
                <button onClick={() => moveBlock('preContent', index, -1)} disabled={index === 0} className="text-gray-500 hover:text-gray-700">↑</button>
                <button onClick={() => moveBlock('preContent', index, 1)} disabled={index === blueprint.preContent.length - 1} className="text-gray-500 hover:text-gray-700">↓</button>
                <button onClick={() => removeBlock('preContent', index)} className="text-red-500 hover:text-red-700">X</button>
              </div>
            </li>
          ))}
        </ul>
        <h4 className="mt-4">Post-Content</h4>
        <ul className="space-y-2">
          {(blueprint.postContent || []).map((block, index) => (
            <li key={block.id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{block.type}</span>
              <div className="space-x-1">
                <button onClick={() => moveBlock('postContent', index, -1)} disabled={index === 0} className="text-gray-500 hover:text-gray-700">↑</button>
                <button onClick={() => moveBlock('postContent', index, 1)} disabled={index === blueprint.postContent.length - 1} className="text-gray-500 hover:text-gray-700">↓</button>
                <button onClick={() => removeBlock('postContent', index)} className="text-red-500 hover:text-red-700">X</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-2">
        <button
          onClick={onSave}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Save
        </button>
        <button
          onClick={onSaveAsLayout}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Save as Layout
        </button>
      </div>
    </div>
  );
}
