import React, { useContext, useEffect, useState, useCallback } from 'react';
import { EditorContext } from '../contexts/EditorContext';
import { debounce } from 'lodash';

const SettingsPanel = () => {
  const { selectedComponent, updateComponentProps, schemas } = useContext(EditorContext);
  const [localProps, setLocalProps] = useState({});

  useEffect(() => {
    if (selectedComponent) {
      setLocalProps(selectedComponent.properties || {});
    }
  }, [selectedComponent]);

  const debouncedUpdate = useCallback(debounce((id, props) => {
    updateComponentProps(id, props);
  }, 300), [updateComponentProps]);

  const handlePropChange = (propName, value) => {
    const newProps = { ...localProps, [propName]: value };
    setLocalProps(newProps);
    debouncedUpdate(selectedComponent.id, { [propName]: value });
  };

  if (!selectedComponent) {
    return (
      <div className="w-72 bg-gray-100 p-4 border-l overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-gray-500 text-sm">Select a component to see its properties here.</p>
        </div>
      </div>
    );
  }

  const schema = schemas[selectedComponent.type];
  if (!schema) {
    return (
      <div className="w-72 bg-gray-100 p-4 border-l">
        <h2 className="text-lg font-semibold mb-2 capitalize">{selectedComponent.type}</h2>
        <p className="text-red-500 text-sm">No schema found for this component type.</p>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-100 p-4 border-l overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2 capitalize">{selectedComponent.type} Settings</h2>
      <div className="space-y-4">
        {Object.keys(schema.properties).map(propName => {
          const propSchema = schema.properties[propName];
          const value = localProps[propName] ?? propSchema.default;

          return (
            <div key={propName}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {propSchema.label || propName}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handlePropChange(propName, e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPanel;
