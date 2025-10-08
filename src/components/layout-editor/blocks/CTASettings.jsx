import React from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';

export const CTASettings = () => {
  const {
    actions: { setProp },
    title,
    text,
    buttonText,
  } = useNode((node) => ({
    title: node.data.props.title,
    text: node.data.props.text,
    buttonText: node.data.props.buttonText,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props) => (props.title = e.target.value), 500)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Text</label>
        <textarea
          value={text}
          onChange={(e) => setProp((props) => (props.text = e.target.value), 500)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Button Text</label>
        <input
          type="text"
          value={buttonText}
          onChange={(e) => setProp((props) => (props.buttonText = e.target.value), 500)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
        <h3 className="text-md font-medium text-gray-800">Styling</h3>
        <ColorControl propKey="backgroundColor" label="Background" />
      </div>
    </div>
  );
};