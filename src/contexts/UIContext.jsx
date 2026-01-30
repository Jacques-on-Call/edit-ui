import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isAddSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('src/pages');

  const openAddSectionModal = () => setAddSectionModalOpen(true);
  const closeAddSectionModal = () => setAddSectionModalOpen(false);

  const value = {
    isAddSectionModalOpen,
    openAddSectionModal,
    closeAddSectionModal,
    // File Explorer Create Modal state
    isCreateOpen,
    setCreateOpen,
    // File Explorer path navigation state
    currentPath,
    setCurrentPath,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
