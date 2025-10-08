import React from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';
import { SpacingControl } from '../settings/SpacingControl';

export const TestimonialSettings = () => {
  const {
    actions: { setProp },
    quote,
    author,
    title,
  } = useNode((node) => ({
    quote: node.data.props.quote,
    author: node.data.props.author,
    title: node.data.props.title,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Quote</label>
        <textarea
          value={quote}
          onChange={(e) => setProp((props) => (props.quote = e.target.value), 500)}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setProp((props) => (props.author = e.target.value), 500)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Author's Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props) => (props.title = e.target.value), 500)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
        <h3 className="text-md font-medium text-gray-800">Styling</h3>
        <ColorControl propKey="backgroundColor" label="Background" />
        <SpacingControl propKey="padding" label="Padding" />
      </div>
    </div>
  );
};