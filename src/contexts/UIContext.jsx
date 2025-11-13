import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [handleGoHome, setHandleGoHome] = useState(() => () => {});

  return (
    <UIContext.Provider value={{ isCreateModalOpen, setCreateModalOpen, handleGoHome, setHandleGoHome }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
