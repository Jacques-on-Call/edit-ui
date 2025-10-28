import { createContext } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';
import { v4 as uuidv4 } from 'uuid';

export const EditorContext = createContext(null);

export const EditorProvider = ({ children }) => {
  const [pageJson, setPageJson] = useState({ id: 'root', type: 'root', children: [] });
  const [schemas, setSchemas] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pageResponse, schemasResponse] = await Promise.all([
          fetch('/schemas/page.json'),
          fetch('/schemas/component-schemas.json'),
        ]);

        if (!pageResponse.ok) throw new Error(`Failed to load page.json: ${pageResponse.statusText}`);
        if (!schemasResponse.ok) throw new Error(`Failed to load component-schemas.json: ${schemasResponse.statusText}`);

        const pageData = await pageResponse.json();
        const schemasData = await schemasResponse.json();

        setPageJson(pageData);
        setSchemas(schemasData);
      } catch (e) {
        console.error("Error fetching initial data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectComponent = useCallback((componentId) => {
    if (!componentId) {
      setSelectedComponent(null);
      return;
    }
    const findComponent = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findComponent(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const component = findComponent(pageJson.children, componentId);
    setSelectedComponent(component);
  }, [pageJson]);

  const updateComponentProps = useCallback((componentId, newProps) => {
    const updateRecursively = (nodes) => {
      return nodes.map(node => {
        if (node.id === componentId) {
          const updatedNode = { ...node, properties: { ...node.properties, ...newProps } };
          // After updating props, also update the selected component instance
          if (selectedComponent && selectedComponent.id === componentId) {
            setSelectedComponent(updatedNode);
          }
          return updatedNode;
        }
        if (node.children) {
          return { ...node, children: updateRecursively(node.children) };
        }
        return node;
      });
    };
    setPageJson(prev => ({ ...prev, children: updateRecursively(prev.children) }));
  }, [selectedComponent]);

  const value = {
    pageJson,
    schemas,
    selectedComponent,
    loading,
    error,
    selectComponent,
    updateComponentProps,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
