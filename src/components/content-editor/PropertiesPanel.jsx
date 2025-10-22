import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash-es';
import { updateBlockProperties } from '../../lib/content/treeOps';
import { BLOCKS } from '../../blocks/registry';

function PropertyInput({ prop, value, onChange, error }) {
  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(prop.name, val);
  };

  const inputClasses = "w-full p-2 border rounded";
  const errorClasses = " border-red-500";

  switch (prop.type) {
    case 'string':
    case 'number':
      return <input type={prop.type === 'number' ? 'number' : 'text'} value={value} onChange={handleChange} className={inputClasses + (error ? errorClasses : '')} required={prop.required} />;
    case 'boolean':
      return <input type="checkbox" checked={!!value} onChange={handleChange} />;
    case 'select':
      return (
        <select value={value} onChange={handleChange} className={inputClasses + (error ? errorClasses : '')}>
          {prop.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'textarea':
      return <textarea value={value} onChange={handleChange} className={inputClasses + (error ? errorClasses : '')} rows="4" required={prop.required}></textarea>;
    default:
      return <p>Unsupported prop type: {prop.type}</p>;
  }
}

export default function PropertiesPanel({ selectedBlock, onContentChange, contentTree }) {
  const [localProps, setLocalProps] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedBlock) {
      setLocalProps(selectedBlock.props || {});
      setErrors({}); // Clear errors on new selection
    }
  }, [selectedBlock]);

  const debouncedContentChange = useCallback(debounce((newTree) => {
    onContentChange(newTree);
  }, 300), [onContentChange]);

  const validateProp = (propDef, propValue) => {
    if (propDef.required && (propValue === '' || propValue === null || propValue === undefined)) {
      return 'This field is required.';
    }
    // Add more validation rules here (e.g., number ranges, regex)
    return null;
  };

  const handlePropChange = (propName, propValue) => {
    const blockDef = BLOCKS.find(b => b.name === selectedBlock.type);
    const propDef = blockDef.props.find(p => p.name === propName);
    const error = validateProp(propDef, propValue);

    setErrors(prev => ({ ...prev, [propName]: error }));

    const newLocalProps = { ...localProps, [propName]: propValue };
    setLocalProps(newLocalProps);

    if (!error && selectedBlock) {
      const newTree = updateBlockProperties(contentTree, selectedBlock.id, newLocalProps);
      debouncedContentChange(newTree);
    }
  };

  if (!selectedBlock) {
    return <div className="text-gray-500">Select a block to edit its properties.</div>;
  }

  const blockDef = BLOCKS.find(b => b.name === selectedBlock.type);

  if (!blockDef) {
    return <div className="text-red-500">Error: Block definition not found.</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{selectedBlock.type} Properties</h3>
      <div className="space-y-4">
        {blockDef.props.map(prop => (
          <div key={prop.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {prop.label || prop.name}
              {prop.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <PropertyInput
              prop={prop}
              value={localProps[prop.name] ?? ''}
              onChange={handlePropChange}
              error={errors[prop.name]}
            />
            {errors[prop.name] && <p className="text-xs text-red-500 mt-1">{errors[prop.name]}</p>}
            {prop.helpText && !errors[prop.name] && <p className="text-xs text-gray-500 mt-1">{prop.helpText}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
