import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Type, Image, Layout } from 'lucide-react';
import MobileToolbar from './MobileToolbar';
import Toolbox from './Toolbox';
import { stateToAstro } from '../../utils/stateToAstro';
import Icon from '../Icon';

// Component Registry
const COMPONENT_TYPES = {
  Section: {
    name: 'Section',
    icon: Layout,
    canHaveChildren: true,
    defaultProps: { bg: 'bg-gray-50' },
    render: ({ props, children }) => (
      <div className={`p-4 rounded-lg ${props.bg} border-2 border-dashed border-gray-300 min-h-[100px]`}>
        {children.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Drop components here</div>
        ) : children}
      </div>
    )
  },
  Hero: {
    name: 'Hero',
    icon: Box,
    canHaveChildren: false,
    defaultProps: { title: 'Hero Title', subtitle: 'Subtitle text' },
    render: ({ props }) => (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">{props.title}</h1>
        <p className="text-lg">{props.subtitle}</p>
      </div>
    )
  },
  TextBlock: {
    name: 'Text Block',
    icon: Type,
    canHaveChildren: false,
    defaultProps: { content: 'Your text here' },
    render: ({ props }) => (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-800">{props.content}</p>
      </div>
    )
  },
  ImagePlaceholder: {
    name: 'Image',
    icon: Image,
    canHaveChildren: false,
    defaultProps: { alt: 'Image' },
    render: () => (
      <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
        <Image className="w-12 h-12 text-gray-400" />
      </div>
    )
  }
};

const LayoutEditor = ({ initialState, filePath }) => {
  const [components, setComponents] = useState(initialState || {
    'root': {
      type: 'root',
      children: [],
      props: {}
    }
  });

  // If the initial state changes (e.g., after loading), update the editor's state.
  useEffect(() => {
    if (initialState) {
      setComponents(initialState);
    }
  }, [initialState]);

  const [selectedId, setSelectedId] = useState(null);
  const [nextId, setNextId] = useState(3);

  const filename = filePath?.split('/').pop();

  const getParent = useCallback((childId) => {
    const parentEntry = Object.entries(components).find(([, comp]) => comp.children?.includes(childId));
    return parentEntry ? parentEntry[0] : null;
  }, [components]);

  const deleteComponent = (id) => {
    const parentId = getParent(id);
    if (!parentId) return;

    // A copy of the components state
    const newComponents = { ...components };

    // Recursively delete the component and all its children
    const deleteRecursive = (compId) => {
      const component = newComponents[compId];
      if (component && component.children) {
        component.children.forEach(deleteRecursive);
      }
      delete newComponents[compId];
    };

    deleteRecursive(id);

    // Remove the component from its parent's children array
    const parent = newComponents[parentId];
    if (parent) {
      newComponents[parentId] = {
        ...parent,
        children: parent.children.filter(childId => childId !== id),
      };
    }

    setComponents(newComponents);
    setSelectedId(null); // Deselect after deletion
  };

  const addComponent = (parentId, type) => {
    const newId = `comp-${nextId}`;
    const newComponent = {
      type,
      children: [],
      props: { ...COMPONENT_TYPES[type].defaultProps },
    };

    const newComponents = {
      ...components,
      [newId]: newComponent,
      [parentId]: {
        ...components[parentId],
        children: [...components[parentId].children, newId],
      },
    };

    setComponents(newComponents);
    setNextId(nextId + 1);
    setSelectedId(newId);
  };

  const moveComponent = (id, direction) => {
    const parentId = getParent(id);
    if (!parentId) return;

    const parent = components[parentId];
    const siblings = parent.children;
    const index = siblings.indexOf(id);

    if (direction === 'up' && index > 0) {
      const newSiblings = [...siblings];
      [newSiblings[index - 1], newSiblings[index]] = [newSiblings[index], newSiblings[index - 1]]; // Swap
      const newComponents = {
        ...components,
        [parentId]: { ...parent, children: newSiblings },
      };
      setComponents(newComponents);
    } else if (direction === 'down' && index < siblings.length - 1) {
      const newSiblings = [...siblings];
      [newSiblings[index], newSiblings[index + 1]] = [newSiblings[index + 1], newSiblings[index]]; // Swap
      const newComponents = {
        ...components,
        [parentId]: { ...parent, children: newSiblings },
      };
      setComponents(newComponents);
    }
  };

  const renderComponent = useCallback((id) => {
    const component = components[id];
    if (!component) {
      console.error(`Component with id ${id} not found.`);
      return null;
    }
    const ComponentDef = COMPONENT_TYPES[component.type];

    if (!ComponentDef) {
        // Fallback for root or unknown types
        if (component.type === 'root') {
            return component.children.map(renderComponent);
        }
        console.error(`Component type ${component.type} not found in registry.`);
        return <div className="text-red-500">Unknown Component: {component.type}</div>;
    }

    return (
      <div
        key={id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(id);
        }}
        className={`relative component-wrapper m-2 p-2 border ${selectedId === id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'}`}
      >
        {selectedId === id && (
          <div className="absolute top-0 right-0 -mt-8 flex space-x-1 bg-slate-700 p-1 rounded-lg shadow-lg">
            <button onClick={() => moveComponent(id, 'up')} disabled={!canMoveUp} className="p-1 hover:bg-slate-600 rounded disabled:opacity-50">
              <Icon name="arrow-up" />
            </button>
            <button onClick={() => moveComponent(id, 'down')} disabled={!canMoveDown} className="p-1 hover:bg-slate-600 rounded disabled:opacity-50">
              <Icon name="arrow-down" />
            </button>
            <button onClick={() => deleteComponent(id)} className="p-1 hover:bg-slate-600 rounded">
              <Icon name="trash" />
            </button>
          </div>
        )}
        <ComponentDef.render
          props={component.props}
          children={component.children.map(renderComponent)}
        />
      </div>
    );
  }, [components, selectedId]);


  const { canMoveUp, canMoveDown } = useMemo(() => {
    if (!selectedId) return { canMoveUp: false, canMoveDown: false };
    const parentId = getParent(selectedId);
    if (!parentId) return { canMoveUp: false, canMoveDown: false };

    const siblings = components[parentId].children;
    const index = siblings.indexOf(selectedId);

    return {
      canMoveUp: index > 0,
      canMoveDown: index < siblings.length - 1,
    };
  }, [selectedId, components, getParent]);

  const handleSave = async () => {
    const astroCode = stateToAstro(components, COMPONENT_TYPES);
    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';
    if (!repo || !filePath) {
      alert('Missing repository or file path information.');
      return;
    }

    try {
      const response = await fetch('/api/save-layout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          path: filePath,
          branch,       // optional: instruct GitHub PUT to commit to this branch
          content: astroCode, // raw content; worker encodes
          message: `feat: create or update layout ${filePath}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save layout (status ${response.status}).`);
      }

      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800 shadow-md z-20">
        <Link to="/explorer" className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <Icon name="home" className="text-white" />
        </Link>
        <h1 className="font-semibold text-center truncate">{filename}</h1>
        <button
          onClick={handleSave}
          className="p-2 rounded-md hover:bg-slate-700 transition-colors"
        >
          <Icon name="publish" className="text-white" />
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto p-4"
        onClick={() => setSelectedId(null)}
      >
        {renderComponent('root')}
      </main>

      {/* Bottom Component Bar */}
      <div className="bg-slate-800 border-t border-slate-700 p-2 shadow-lg">
        <div className="flex space-x-2 overflow-x-auto">
          {Object.entries(COMPONENT_TYPES).map(([type, { name, icon: IconComponent }]) => (
            <button
              key={type}
              onClick={() => {
                const parentId = selectedId && COMPONENT_TYPES[components[selectedId]?.type]?.canHaveChildren ? selectedId : getParent(selectedId) || 'root';
                addComponent(parentId, type);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-700 transition-colors w-20 flex-shrink-0"
            >
              <IconComponent className="h-6 w-6 text-white mb-1" />
              <span className="text-xs text-white">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayoutEditor;
