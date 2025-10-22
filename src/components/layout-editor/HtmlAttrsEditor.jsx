import React from 'react';
import Icon from '../Icon';

const HtmlAttrsEditor = ({ value, onChange }) => {
  const handleAddAttr = () => {
    onChange({ ...value, [`newAttr${Object.keys(value).length}`]: '' });
  };

  const handleRemoveAttr = (attrName) => {
    const { [attrName]: _, ...newAttrs } = value;
    onChange(newAttrs);
  };

  const handleAttrChange = (oldName, newName, newValue) => {
    const { [oldName]: _, ...rest } = value;
    onChange({ ...rest, [newName]: newValue });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-slate-400">HTML Attributes</h3>
        <button onClick={handleAddAttr} className="p-1 rounded-md hover:bg-slate-700">
          <Icon name="add" className="text-white" />
        </button>
      </div>
      <div className="space-y-2">
        {Object.entries(value).map(([name, val]) => (
          <div key={name} className="flex items-center space-x-2">
            <input
              type="text"
              value={name}
              onChange={(e) => handleAttrChange(name, e.target.value, val)}
              placeholder="Attribute"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
            />
            <input
              type="text"
              value={val}
              onChange={(e) => handleAttrChange(name, name, e.target.value)}
              placeholder="Value"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
            />
            <button onClick={() => handleRemoveAttr(name)} className="p-1 rounded-md hover:bg-slate-700">
              <Icon name="delete" className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HtmlAttrsEditor;
