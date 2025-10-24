import React from 'react';

// A simple renderer for a single property control
function PropEditor({ label, type, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm">{label}</div>
      <input
        type={type}
        className="w-full p-2 border rounded-md"
        value={value || ''}
        onChange={onChange}
      />
    </label>
  );
}


// Renders the correct set of controls based on the block's type
function getBlockControls(block, onChange) {
  if (!block) return null;

  switch (block.name) {
    case 'Heading':
      return (
        <>
          <PropEditor
            label="Text"
            type="text"
            value={block.props?.text}
            onChange={(e) => onChange('props.text', e.target.value)}
          />
          {/* Add more controls for level, align, etc. later */}
        </>
      );
    case 'Button':
      return (
        <>
          <PropEditor
            label="Label"
            type="text"
            value={block.props?.label}
            onChange={(e) => onChange('props.label', e.target.value)}
          />
          <PropEditor
            label="URL"
            type="text"
            value={block.props?.href}
            onChange={(e) => onChange('props.href', e.target.value)}
          />
        </>
      );
    // Add cases for Image, Text, etc. here
    default:
      return <p className="text-sm text-gray-500">No editable properties for this component.</p>;
  }
}

export default function BlockSettingsSheet({ visible, block, onChange, onClose }) {
  if (!visible || !block) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Edit {block.name}</h3>
          <button className="px-3 py-1 rounded bg-gray-900 text-white" onClick={onClose}>Done</button>
        </div>
        <div className="space-y-4">
          {getBlockControls(block, onChange)}
        </div>
      </div>
    </div>
  );
}
