import React from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';
import { SpacingControl } from '../settings/SpacingControl';

export const HeroSettings = () => {
  const {
    actions: { setProp },
    title,
    subtitle,
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props) => (props.title = e.target.value), 500)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Subtitle</label>
        <textarea
          value={subtitle}
          onChange={(e) => setProp((props) => (props.subtitle = e.target.value), 500)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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