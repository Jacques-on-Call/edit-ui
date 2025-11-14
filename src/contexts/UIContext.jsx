import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('src/pages');

  const navigateToPath = useCallback((newPath) => {
    setCurrentPath(newPath);
  }, []);

  const navigateBack = useCallback(() => {
    // Navigate up one folder level
    const pathParts = currentPath.split('/');
    if (pathParts.length <= 2) {
      // Already at root level (src/pages), do nothing
      return;
    }
    
    // Remove the last part to go up one level
    const parentPath = pathParts.slice(0, -1).join('/');
    setCurrentPath(parentPath);
  }, [currentPath]);

  const navigateHome = useCallback(() => {
    const homePath = 'src/pages';
    setCurrentPath(homePath);
  }, []);

  return (
    <UIContext.Provider value={{ 
      isCreateOpen, 
      setCreateOpen,
      currentPath,
      setCurrentPath,
      navigateToPath,
      navigateBack,
      navigateHome
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
