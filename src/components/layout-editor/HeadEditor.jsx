import React from 'react';
import Icon from '../Icon';

const MetaAttributeEditor = ({ attrName, attrValue, onNameChange, onValueChange, onRemove }) => (
  <div className="flex items-center space-x-2">
    <input
      type="text"
      value={attrName}
      onChange={onNameChange}
      placeholder="name"
      className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
    />
    <input
      type="text"
      value={attrValue}
      onChange={onValueChange}
      placeholder="content"
      className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
    />
    <button onClick={onRemove} className="p-1 rounded-md hover:bg-slate-700">
      <Icon name="delete" className="text-red-500" />
    </button>
  </div>
);

const HeadNodeEditor = ({ node, onChange, onRemove }) => {
  if (node.type === 'meta') {
    const handleAttrChange = (oldName, newName, newValue) => {
        const newAttrs = { ...node.attrs };
        if (oldName !== newName) {
            delete newAttrs[oldName];
        }
        newAttrs[newName] = newValue;
        onChange({ ...node, attrs: newAttrs });
    };

    const handleAddAttr = () => {
        onChange({ ...node, attrs: { ...node.attrs, newAttr: '' } });
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-slate-500">meta</span>
            <button onClick={onRemove} className="p-1 rounded-md hover:bg-slate-700">
                <Icon name="delete" className="text-red-500" />
            </button>
        </div>
        {Object.entries(node.attrs).map(([name, value]) => (
            <MetaAttributeEditor
                key={name}
                attrName={name}
                attrValue={value}
                onNameChange={(e) => handleAttrChange(name, e.target.value, value)}
                onValueChange={(e) => handleAttrChange(name, name, e.target.value)}
                onRemove={() => {
                    const { [name]: _, ...newAttrs } = node.attrs;
                    onChange({ ...node, attrs: newAttrs });
                }}
            />
        ))}
        <button onClick={handleAddAttr} className="text-xs text-slate-400 hover:text-white">+ Add Attribute</button>
      </div>
    );
  }

  if (node.type === 'title') {
    return (
       <div className="flex items-center space-x-2">
         <span className="text-slate-500">title</span>
         <input
           type="text"
           value={node.contentFromProp || node.text || ''}
            onChange={(e) => onChange({ ...node, text: e.target.value, contentFromProp: undefined })}
           placeholder="Title text or {propName}"
           className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm"
         />
         <button onClick={onRemove} className="p-1 rounded-md hover:bg-slate-700">
          <Icon name="delete" className="text-red-500" />
        </button>
       </div>
    );
  }

  if (node.type === 'raw') {
    return (
       <div className="flex items-start space-x-2">
        <span className="text-slate-500 mt-1.5">raw</span>
         <textarea
           value={node.html}
            onChange={(e) => onChange({ ...node, html: e.target.value })}
           placeholder="<link...>, <script...>"
           className="flex-1 bg-slate-900 border border-slate-600 rounded-md p-1.5 text-sm h-20"
         />
         <button onClick={onRemove} className="p-1 rounded-md hover:bg-slate-700">
          <Icon name="delete" className="text-red-500" />
        </button>
       </div>
    );
  }

  return null;
};


const HeadEditor = ({ value, onChange }) => {
  const handleAddNode = (type) => {
    let newNode = {};
    if (type === 'meta') newNode = { type: 'meta', attrs: { name: 'description', content: '' } };
    if (type === 'title') newNode = { type: 'title', text: 'My Page Title' };
    if (type === 'raw') newNode = { type: 'raw', html: '<link rel="stylesheet" href="/styles.css">' };
    onChange([...value, newNode]);
  };

  const handleRemoveNode = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleNodeChange = (index, newNode) => {
    const newHead = [...value];
    newHead[index] = newNode;
    onChange(newHead);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-slate-400">Head</h3>
        <div>
          <button onClick={() => handleAddNode('meta')} className="p-1 rounded-md hover:bg-slate-700 text-xs">meta</button>
          <button onClick={() => handleAddNode('title')} className="p-1 rounded-md hover:bg-slate-700 text-xs">title</button>
          <button onClick={() => handleAddNode('raw')} className="p-1 rounded-md hover:bg-slate-700 text-xs">raw</button>
        </div>
      </div>
      <div className="space-y-2">
        {value.map((node, index) => (
          <div key={index} className="bg-slate-800/50 p-2 rounded-md">
            <HeadNodeEditor
              node={node}
              onChange={(newNode) => handleNodeChange(index, newNode)}
              onRemove={() => handleRemoveNode(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeadEditor;
