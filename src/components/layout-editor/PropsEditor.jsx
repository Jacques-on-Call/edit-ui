import React from 'react';
import Icon from '../Icon';

const PropRow = ({ propName, prop, onChange, onRemove }) => {
  const handleTypeChange = (e) => {
    let defaultValue = '';
    if (e.target.value === 'boolean') defaultValue = false;
    if (e.target.value === 'number') defaultValue = 0;
    onChange(propName, { ...prop, type: e.target.value, default: defaultValue });
  };

  const handleDefaultChange = (e) => {
    let value = e.target.value;
    if (prop.type === 'boolean') value = e.target.checked;
    if (prop.type === 'number') value = parseFloat(e.target.value) || 0;
    onChange(propName, { ...prop, default: value });
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    onChange(propName, { ...prop }, newName);
  };

  const renderDefaultInput = () => {
    if (prop.type === 'boolean') {
      return <input type="checkbox" checked={!!prop.default} onChange={handleDefaultChange} />;
    }
    if (prop.type === 'number') {
      return <input type="number" value={prop.default || 0} onChange={handleDefaultChange} className="bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm w-full" />;
    }
    return <input type="text" value={prop.default || ''} onChange={handleDefaultChange} className="bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm w-full" />;
  };

  return (
    <div className="grid grid-cols-4 gap-2 items-center">
      <input type="text" value={propName} onChange={handleNameChange} placeholder="propName" className="bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm" />
      <select value={prop.type} onChange={handleTypeChange} className="bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm">
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
      </select>
      <div>{renderDefaultInput()}</div>
      <button onClick={() => onRemove(propName)} className="p-1 rounded-md hover:bg-slate-700">
        <Icon name="delete" className="text-red-500" />
      </button>
    </div>
  );
};

const PropsEditor = ({ value, onChange }) => {
  const handleAddProp = () => {
    const newProps = { ...value, [`newProp${Object.keys(value).length}`]: { type: 'string', default: '' } };
    onChange(newProps);
  };

  const handleRemoveProp = (propName) => {
    const { [propName]: _, ...newProps } = value;
    onChange(newProps);
  };

  const handlePropChange = (oldName, prop, newName) => {
    const { [oldName]: _, ...rest } = value;
    onChange({ ...rest, [newName || oldName]: prop });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-slate-400">Props</h3>
        <button onClick={handleAddProp} className="p-1 rounded-md hover:bg-slate-700">
          <Icon name="add" className="text-white" />
        </button>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2 text-sm text-slate-500">
          <span>Name</span>
          <span>Type</span>
          <span>Default</span>
          <span></span>
        </div>
        {Object.entries(value).map(([propName, prop]) => (
          <PropRow
            key={propName}
            propName={propName}
            prop={prop}
            onChange={handlePropChange}
            onRemove={handleRemoveProp}
          />
        ))}
      </div>
    </div>
  );
};

export default PropsEditor;
