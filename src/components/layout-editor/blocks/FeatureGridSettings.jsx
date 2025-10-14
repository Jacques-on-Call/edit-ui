import React from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';
import { SpacingControl } from '../settings/SpacingControl';

export const FeatureGridSettings = () => {
  const {
    actions: { setProp },
    title,
    features,
  } = useNode((node) => ({
    title: node.data.props.title,
    features: node.data.props.features,
  }));

  const handleFeatureChange = (index, prop, value) => {
    const newFeatures = [...features];
    newFeatures[index][prop] = value;
    setProp((props) => (props.features = newFeatures), 500);
  };

  const handleAddFeature = () => {
    const newFeatures = [...features, { title: 'New Feature', description: 'New description' }];
    setProp((props) => (props.features = newFeatures));
  };

  const handleRemoveFeature = (index) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    setProp((props) => (props.features = newFeatures));
  };

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

      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
        <h3 className="text-md font-medium text-gray-800">Features</h3>
        {features.map((feature, index) => (
          <div key={index} className="p-3 bg-gray-100 rounded-lg space-y-2 relative">
            <button
              onClick={() => handleRemoveFeature(index)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
              &times;
            </button>
            <input
              type="text"
              value={feature.title}
              onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md"
              placeholder="Feature Title"
            />
            <textarea
              value={feature.description}
              onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
              rows="2"
              className="w-full px-2 py-1 border border-gray-300 rounded-md"
              placeholder="Feature Description"
            />
          </div>
        ))}
        <button
          onClick={handleAddFeature}
          className="w-full text-center px-4 py-2 border border-dashed border-gray-400 text-gray-600 rounded-md hover:bg-gray-100"
        >
          + Add Feature
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
        <h3 className="text-md font-medium text-gray-800">Styling</h3>
        <ColorControl propKey="backgroundColor" label="Background" />
        <SpacingControl propKey="padding" label="Padding" />
      </div>
    </div>
  );
};