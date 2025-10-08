import React from 'react';
import { useNode } from '@craftjs/core';

export const ColorControl = ({ propKey, label }) => {
  const {
    actions: { setProp },
    propValue,
  } = useNode((node) => ({
    // Access the style prop safely.
    propValue: node.data.props.style ? node.data.props.style[propKey] : '',
  }));

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative flex items-center space-x-2">
        <div
          className="w-6 h-6 rounded-full border border-gray-300"
          style={{ backgroundColor: propValue }}
        />
        <input
          type="text"
          value={propValue || ''}
          onChange={(e) => {
            setProp((props) => (props.style[propKey] = e.target.value), 500); // Debounce for 500ms
          }}
          className="w-28 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};