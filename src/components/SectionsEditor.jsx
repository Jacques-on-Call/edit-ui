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
    <div class="p-4 space-y-4">
      {local.map((s, i) => {
        const EditorComponent = editorComponentRegistry[s.type];
        return (
          <div key={s.id || i} class="bg-gray-800 border border-gray-700 rounded-lg shadow-md">
            <div class="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 class="text-lg font-semibold capitalize text-white">{s.type.replace(/_/g, ' ')}</h3>
              <button
                onClick={() => handleRemove(i)}
                class="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove section"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div class="p-4">
              {EditorComponent ? (
                <EditorComponent
                  props={s.props}
                  onChange={(newProps) => updateSectionProp(i, 'props', newProps)}
                />
              ) : (
                <div class="space-y-3">
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
