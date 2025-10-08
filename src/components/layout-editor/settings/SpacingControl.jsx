import React from 'react';
import { useNode } from '@craftjs/core';

export const SpacingControl = ({ propKey, label }) => {
  const {
    actions: { setProp },
    propValue = {}, // Default to an empty object
  } = useNode((node) => ({
    propValue: node.data.props.style ? node.data.props.style[propKey] : {},
  }));

  const handleChange = (e, side) => {
    const value = e.target.value;
    setProp((props) => {
      if (!props.style) props.style = {};
      if (!props.style[propKey]) props.style[propKey] = {};
      // Create a new object to avoid direct mutation issues
      const newSpacing = { ...props.style[propKey], [side]: `${value}px` };
      props.style[propKey] = newSpacing;
    }, 500); // Debounce
  };

  const parseValue = (value) => (value ? parseInt(value, 10) : '');

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center">
          <input
            type="number"
            value={parseValue(propValue.top)}
            onChange={(e) => handleChange(e, 'top')}
            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center"
          />
          <span className="text-xs text-gray-500 mt-1">Top</span>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="number"
            value={parseValue(propValue.right)}
            onChange={(e) => handleChange(e, 'right')}
            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center"
          />
          <span className="text-xs text-gray-500 mt-1">Right</span>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="number"
            value={parseValue(propValue.bottom)}
            onChange={(e) => handleChange(e, 'bottom')}
            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center"
          />
          <span className="text-xs text-gray-500 mt-1">Bottom</span>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="number"
            value={parseValue(propValue.left)}
            onChange={(e) => handleChange(e, 'left')}
            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center"
          />
          <span className="text-xs text-gray-500 mt-1">Left</span>
        </div>
      </div>
    </div>
  );
};