import React, { useContext, useState, useEffect } from 'react';
import { EditorContext } from '../contexts/EditorContext';

const ComponentRenderer = ({ component, path, onSelect }) => {
  const { selectedComponent } = useContext(EditorContext);
  const isSelected = selectedComponent && selectedComponent.id === component.id;

  const style = {
    padding: '0.5rem',
    margin: '0.5rem',
    border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(component.id, path);
  };

  return (
    <div style={style} onClick={handleClick}>
      <div className="text-xs text-gray-500 font-mono select-none">{component.type}</div>
      {component.children && component.children.length > 0 && (
        <div className="ml-4 border-l pl-4 mt-2">
          {component.children.map((child, index) => (
            <ComponentRenderer key={child.id} component={child} path={[...path, index]} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const Breadcrumbs = ({ path, onSelect }) => {
    const { pageJson } = useContext(EditorContext);
    if (!path || path.length === 0) return null;

    let currentLevel = pageJson;
    const crumbs = path.map((p, i) => {
        currentLevel = currentLevel.children[p];
        const currentPath = path.slice(0, i + 1);
        return (
            <span key={currentLevel.id}>
                <button onClick={() => onSelect(currentLevel.id, currentPath)} className="text-blue-500 hover:underline">
                    {currentLevel.type}
                </button>
                {i < path.length - 1 && <span className="mx-2 text-gray-500">{'>'}</span>}
            </span>
        );
    });

    return <div className="p-2 bg-gray-100 border-b text-sm">{crumbs}</div>;
};


const LayoutEditor = () => {
  const { pageJson, selectComponent } = useContext(EditorContext);
  const [selectedPath, setSelectedPath] = useState([]);

  const handleSelect = (componentId, path) => {
      selectComponent(componentId);
      setSelectedPath(path);
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
        <Breadcrumbs path={selectedPath} onSelect={handleSelect} />
        <div className="flex-1 p-4 overflow-auto bg-gray-200">
        {pageJson.children.map((component, index) => (
            <ComponentRenderer key={component.id} component={component} path={[index]} onSelect={handleSelect} />
        ))}
        </div>
    </div>
  );
};

export default LayoutEditor;
