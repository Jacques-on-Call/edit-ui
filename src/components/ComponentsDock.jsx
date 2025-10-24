import React from 'react';
import Icon from './Icon';

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
      <div className="flex justify-between items-center px-3 pt-2">
        <p className="text-xs text-gray-500">Tap to add. Long-press a block for settings.</p>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
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
