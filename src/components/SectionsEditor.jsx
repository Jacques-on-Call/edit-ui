import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import editorComponentRegistry from './editor-components/registry';

export default function SectionsEditor({ sections = [], onChange }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(sections)));

  // This effect synchronizes the internal state with the parent's prop.
  // This is crucial to prevent stale state if the parent re-renders.
  useEffect(() => {
    setLocal(JSON.parse(JSON.stringify(sections)));
  }, [sections]);

  const updateSectionProp = (index, propPath, value) => {
    const next = [...local];
    if (!next[index]) return;

    // If propPath is 'props', it means the whole props object is being updated.
    if (propPath === 'props') {
      next[index].props = { ...next[index].props, ...value };
    } else {
      // Handle nested paths like 'props.title' for the generic fallback
      const [root, key] = propPath.split('.');
      if (root === 'props' && key) {
        next[index].props = { ...next[index].props, [key]: value };
      } else {
        next[index][propPath] = value;
      }
    }

    setLocal(next);
    onChange(next);
  };

  const handleAdd = () => {
    const next = [...local, { type: 'text_section', props: { title: 'New section', body: 'Write content...' } }];
    setLocal(next);
    onChange(next);
  };

  const handleRemove = (i) => {
    const next = local.filter((_, index) => index !== i);
    setLocal(next);
    onChange(next);
  };

  const handleSave = () => {
    onChange(local);
    console.log('[SectionsEditor] saved sections:', local);
  };

  return (
    <div>
      {local.map((s, i) => {
        const EditorComponent = editorComponentRegistry[s.type];
        return (
          <div key={s.id || i} class="group relative py-1 border-l-4 border-transparent hover:border-gray-700 transition-colors duration-200">
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center z-10">
              <span class="text-xs text-gray-500 mr-2 uppercase">{s.type.replace(/_/g, ' ')}</span>
              <button
                onClick={() => handleRemove(i)}
                class="text-gray-500 hover:text-red-500 transition-colors p-1"
                aria-label="Remove section"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>

            <div>
              {EditorComponent ? (
                <EditorComponent
                  props={s.props}
                  onChange={(newProps) => updateSectionProp(i, 'props', newProps)}
                />
              ) : (
                <div class="space-y-3 p-4 border border-dashed border-gray-600 rounded-lg">
                   <h4 class="text-sm font-semibold text-gray-400">Generic Editor (type: {s.type})</h4>
                  {Object.entries(s.props || {}).map(([key, value]) => (
                    <div key={key}>
                      <label class="block text-sm font-medium text-gray-300 mb-1 capitalize">{key}</label>
                      <input
                        type="text"
                        class="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        value={value}
                        onInput={(e) => updateSectionProp(i, `props.${key}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
