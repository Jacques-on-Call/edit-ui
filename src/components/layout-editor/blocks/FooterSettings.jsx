import React from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';
import { SpacingControl } from '../settings/SpacingControl';

export const FooterSettings = () => {
  const {
    actions: { setProp },
    text,
  } = useNode((node) => ({
    text: node.data.props.text,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Copyright Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setProp((props) => (props.text = e.target.value), 500)}
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