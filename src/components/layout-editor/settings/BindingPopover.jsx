import React from 'react';

export const BindingPopover = ({ schema, onSelect, onClose }) => {
  if (!schema || !schema.fields) {
    return null;
  }

  return (
    // A simple popover implementation using fixed position and a backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <h3 className="font-semibold text-gray-800">Select a Data Field</h3>
        </div>
        <ul className="py-2 max-h-64 overflow-y-auto">
          {schema.fields.map((field) => (
            <li key={field.id}>
              <button
                onClick={() => {
                  onSelect(`{{${field.id}}}`);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white"
              >
                <span className="font-mono text-xs bg-gray-100 p-1 rounded mr-2">{`{{...}}`}</span>
                {field.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};