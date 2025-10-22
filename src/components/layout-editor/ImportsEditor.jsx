import React from 'react';
import Icon from '../Icon';

const ImportsEditor = ({ value, onChange }) => {
  const handleAddImport = () => {
    onChange([...value, { as: 'NewComponent', from: 'src/components/NewComponent.astro' }]);
  };

  const handleRemoveImport = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleImportChange = (index, key, newValue) => {
    const newImports = [...value];
    newImports[index][key] = newValue;
    onChange(newImports);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-slate-400">Imports</h3>
        <button onClick={handleAddImport} className="p-1 rounded-md hover:bg-slate-700">
          <Icon name="add" className="text-white" />
        </button>
      </div>
      <div className="space-y-2">
        {value.map((imp, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={imp.as}
              onChange={(e) => handleImportChange(index, 'as', e.target.value)}
              placeholder="Component"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
            />
            <span className="text-slate-500">from</span>
            <input
              type="text"
              value={imp.from}
              onChange={(e) => handleImportChange(index, 'from', e.target.value)}
              placeholder="path/to/component.astro"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
            />
            <button onClick={() => handleRemoveImport(index)} className="p-1 rounded-md hover:bg-slate-700">
              <Icon name="delete" className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportsEditor;
