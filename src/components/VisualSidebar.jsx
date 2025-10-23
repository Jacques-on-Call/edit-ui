import React from 'react';

export default function VisualSidebar({ blueprint, setBlueprint, onSave, onSaveAsLayout }) {
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
          <label className="block text-sm font-medium text-gray-700">Presets</label>
          <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option>Classic</option>
            <option>Split</option>
            <option>Full Banner</option>
            <option>Article</option>
            <option>Card Grid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Background</label>
          <div className="mt-1 flex items-center">
            <input
              type="color"
              className="w-8 h-8 border-gray-300 rounded-md"
              value={blueprint.htmlAttrs?.theme?.background || '#ffffff'}
              onChange={(e) => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, background: e.target.value })}
            />
            <button className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm">Image</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Typography Scale</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'S' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, typographyScale: 'S' })}
            >
              S
            </button>
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'M' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, typographyScale: 'M' })}
            >
              M
            </button>
            <button
              className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.typographyScale === 'L' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
              onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, typographyScale: 'L' })}
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
                  onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, spacing: 'compact' })}
                >
                  Compact
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.spacing === 'normal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, spacing: 'normal' })}
                >
                  Normal
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.spacing === 'roomy' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, spacing: 'roomy' })}
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
                  onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, alignment: 'left' })}
                >
                  Left
                </button>
                <button
                  className={`px-3 py-1.5 border rounded-md text-sm ${blueprint.htmlAttrs?.theme?.alignment === 'center' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                  onClick={() => handleHtmlAttrChange('theme', { ...blueprint.htmlAttrs.theme, alignment: 'center' })}
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
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Heading</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Text</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Image</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Button</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">List</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Quote</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Table</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">Spacer</button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Page Blocks</h3>
        <ul className="space-y-2">
          <li className="flex items-center justify-between p-2 border rounded-md">
            <span>Heading</span>
            <div className="space-x-1">
              <button className="text-gray-500 hover:text-gray-700">↑</button>
              <button className="text-gray-500 hover:text-gray-700">↓</button>
            </div>
          </li>
          <li className="flex items-center justify-between p-2 border rounded-md">
            <span>Text</span>
            <div className="space-x-1">
              <button className="text-gray-500 hover:text-gray-700">↑</button>
              <button className="text-gray-500 hover:text-gray-700">↓</button>
            </div>
          </li>
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
