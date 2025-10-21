import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Type, Image, Layout } from 'lucide-react';
import MobileToolbar from './MobileToolbar';
import Toolbox from './Toolbox';
import { stateToAstro } from '../../utils/stateToAstro';

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
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [nextId, setNextId] = useState(3);

  const filename = filePath?.split('/').pop();

  const handleExit = () => {
    // A more robust navigation would use the `from` param if available
    window.history.back();
  };

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
        className={`component-wrapper m-2 p-2 border ${selectedId === id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'}`}
      >
        <ComponentDef.render
          props={component.props}
          children={component.children.map(renderComponent)}
        />
      </div>
    );
  }, [components, selectedId]);


  const [isToolboxOpen, setToolboxOpen] = useState(false);

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

  const handleAddComponent = (parentId, type) => {
    addComponent(parentId, type);
    setToolboxOpen(false);
  }

  const handleSave = async () => {
    const astroCode = stateToAstro(components, COMPONENT_TYPES);
    const repo = localStorage.getItem('selectedRepo');
    if (!repo || !filePath) {
      alert('Missing repository or file path information.');
      return;
    }

    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Credentials': 'include'
        },
        body: JSON.stringify({
          repo: repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(astroCode))),
          message: `feat: update layout ${filePath}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save layout.');
      }

      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* NEW HEADER */}
      <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800 shadow-md z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition font-semibold text-sm"
          >
            Exit
          </button>
          <button
            onClick={() => setSideDrawerOpen(true)}
            className="md:hidden px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition font-semibold text-sm"
          >
            Components
          </button>
        </div>
        <h1 className="font-semibold text-center truncate">{filename}</h1>
        <button
          onClick={handleSave}
          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition font-semibold text-sm"
        >
          Save
        </button>
      </header>

      {/* Side Drawer (Mobile) */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-slate-800 shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isSideDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="p-4">
          <button onClick={() => setSideDrawerOpen(false)} className="text-white mb-4">
            &times; Close
          </button>
          <h2 className="text-xl font-bold mb-4">Components</h2>
          <div className="space-y-2">
            {Object.entries(COMPONENT_TYPES).map(([key, comp]) => (
              <button
                key={key}
                onClick={() => {
                  const parentId = selectedId && COMPONENT_TYPES[components[selectedId]?.type]?.canHaveChildren ? selectedId : getParent(selectedId) || 'root';
                  addComponent(parentId, key);
                  setSideDrawerOpen(false); // Close drawer after adding
                }}
                className="w-full text-left px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                + {comp.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isSideDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSideDrawerOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-slate-800 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Components</h2>
          <div className="space-y-2">
            {Object.entries(COMPONENT_TYPES).map(([key, comp]) => (
              <button
                key={key}
                onClick={() => {
                  const parentId = selectedId && COMPONENT_TYPES[components[selectedId]?.type]?.canHaveChildren ? selectedId : getParent(selectedId) || 'root';
                  addComponent(parentId, key);
                }}
                className="w-full text-left px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                + {comp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto p-4" onClick={() => setSelectedId(null)}>
          {renderComponent('root')}
        </main>
      </div>
    </div>
  );
};

export default LayoutEditor;