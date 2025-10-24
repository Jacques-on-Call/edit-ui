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

export default function ComponentsDock({ palette = DEFAULT_PALETTE, onAdd, visible, onClose }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t">
      <div className="px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-500">Tap to add. Long-press a block for settings.</p>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {palette.map((p) => (
            <button
              key={p.type}
              className="shrink-0 px-3 py-2 rounded-lg border bg-gray-50 text-sm"
              onClick={() => onAdd?.(p.type)}
              title={`Add ${p.label} block`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
