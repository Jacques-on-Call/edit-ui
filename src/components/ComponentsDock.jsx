import React from 'react';

const DEFAULT_PALETTE = [
  { type: 'Heading', label: 'Heading' },
  { type: 'Text', label: 'Text' },
  { type: 'Image', label: 'Image' },
  { type: 'Button', label: 'Button' },
  { type: 'Columns', label: 'Columns' },
  { type: 'Table', label: 'Table' },
  { type: 'Section', label: 'Section' },
];

export default function ComponentsDock({ palette = DEFAULT_PALETTE, onAdd, visible }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t">
      <div className="px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] overflow-x-auto">
        <div className="flex items-center gap-2">
          {palette.map((p) => (
            <button
              key={p.type}
              className="shrink-0 px-3 py-2 rounded-lg border bg-gray-50 text-sm"
              onClick={() => onAdd?.(p.type)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
