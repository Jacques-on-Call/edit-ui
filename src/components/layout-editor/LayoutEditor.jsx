import React, { useState, useCallback, useMemo } from 'react';
import { Box, Type, Image, Layout } from 'lucide-react';
import MobileToolbar from './MobileToolbar';
import Toolbox from './Toolbox';

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

const LayoutEditor = () => {
  const [components, setComponents] = useState({
    'root': {
      type: 'root',
      children: ['comp-1'],
      props: {}
    },
    'comp-1': {
      type: 'Section',
      children: ['comp-2'],
      props: { bg: 'bg-blue-50' }
    },
    'comp-2': {
      type: 'Hero',
      children: [],
      props: { title: 'Welcome!', subtitle: 'Tap a component to see its controls.' }
    }
  });

  const [selectedId, setSelectedId] = useState(null);
  const [nextId, setNextId] = useState(3);

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

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Mobile Layout Editor</h1>
        {/* Placeholder for future actions like Save */}
      </header>

      <main
        className="flex-1 overflow-y-auto p-4 pb-24" // padding-bottom to avoid overlap with toolbar
        onClick={() => setSelectedId(null)}
      >
        {renderComponent('root')}
      </main>

      <MobileToolbar
        selectedId={selectedId}
        onMove={(direction) => moveComponent(selectedId, direction)}
        onDelete={() => deleteComponent(selectedId)}
        onOpenToolbox={() => setToolboxOpen(true)}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />

      <Toolbox
        isOpen={isToolboxOpen}
        onClose={() => setToolboxOpen(false)}
        onAddComponent={handleAddComponent}
        componentTypes={COMPONENT_TYPES}
        targetParentId={selectedId && COMPONENT_TYPES[components[selectedId]?.type]?.canHaveChildren ? selectedId : getParent(selectedId) || 'root' }
      />
    </div>
  );
};

export default LayoutEditor;