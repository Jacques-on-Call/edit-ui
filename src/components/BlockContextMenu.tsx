import React from 'react';

export default function BlockContextMenu({ visible, x, y, onAction }) {
  if (!visible) return null;
  return (
    <div className="fixed z-50 bg-white border rounded-md shadow-lg" style={{ left: x, top: y, minWidth: 180 }}>
      {[
        { k: 'edit', label: 'Edit settings' },
        { k: 'move-up', label: 'Move up' },
        { k: 'move-down', label: 'Move down' },
        { k: 'duplicate', label: 'Duplicate' },
        { k: 'delete', label: 'Delete', danger: true },
      ].map(item => (
        <button
          key={item.k}
          className={`w-full text-left px-3 py-2 text-sm ${item.danger ? 'text-red-600' : ''} hover:bg-gray-100`}
          onClick={() => onAction?.(item.k)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
