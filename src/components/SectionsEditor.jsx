import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function SectionsEditor({ sections = [], onChange }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(sections)));

  const updateSectionProp = (index, propPath, value) => {
    const next = [...local];
    const [root, key] = propPath.split('.');
    if (!next[index]) return;
    if (root === 'props') {
      next[index].props = { ...next[index].props, [key]: value };
    } else {
      next[index][propPath] = value;
    }
    setLocal(next);
    onChange(next); // This is the critical fix for autosave
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
    <div class="p-4 bg-gray-800 rounded-md">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Page Sections</h2>
        <div>
          <button onClick={handleAdd} class="px-3 py-1 bg-blue-600 rounded">Add Section</button>
          <button onClick={handleSave} class="ml-2 px-3 py-1 bg-green-600 rounded">Save</button>
        </div>
      </div>
      {local.map((s, i) => (
        <div key={i} class="mb-4 p-3 bg-gray-700 rounded">
          <div class="flex justify-between items-center mb-2">
            <strong>{s.type}</strong>
            <button onClick={() => handleRemove(i)} class="text-sm text-red-400">Remove</button>
          </div>
          <div class="mb-2">
            <label class="block text-xs text-gray-300">Title</label>
            <input
              class="w-full p-2 rounded bg-gray-800 border border-gray-600"
              value={s.props?.title || ''}
              onInput={(e) => updateSectionProp(i, 'props.title', e.target.value)}
            />
          </div>
          <div class="mb-2">
            <label class="block text-xs text-gray-300">Body</label>
            <textarea
              class="w-full p-2 rounded bg-gray-800 border border-gray-600"
              rows="4"
              value={s.props?.body || ''}
              onInput={(e) => updateSectionProp(i, 'props.body', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}