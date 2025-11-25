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
    <div class="bg-gray-800">
      <div class="flex items-center justify-between mb-3 px-4 pt-4">
        <h2 class="text-lg font-semibold">Page Sections</h2>
      </div>
      {local.map((s, i) => {
        const EditorComponent = editorComponentRegistry[s.type];
        return (
          <div key={i} class="mb-4 p-3 bg-gray-700 rounded-lg">
            <div class="flex justify-between items-center mb-3">
              <strong class="text-sm font-semibold capitalize">{s.type.replace(/_/g, ' ')}</strong>
              <button onClick={() => handleRemove(i)} class="text-xs text-red-400 hover:text-red-300">Remove</button>
            </div>

            {EditorComponent ? (
              <EditorComponent
                props={s.props}
                onChange={(newProps) => updateSectionProp(i, 'props', newProps)}
              />
            ) : (
              // Fallback to generic fields if no specific editor component is found
              <div class="space-y-2">
                <div>
                  <label class="block text-xs text-gray-300">Title</label>
                  <input
                    class="w-full p-2 rounded bg-gray-800 border border-gray-600"
                    value={s.props?.title || ''}
                    onInput={(e) => updateSectionProp(i, 'props.title', e.target.value)}
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-300">Body</label>
                  <textarea
                    class="w-full p-2 rounded bg-gray-800 border border-gray-600"
                    rows="4"
                    value={s.props?.body || ''}
                    onInput={(e) => updateSectionProp(i, 'props.body', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
