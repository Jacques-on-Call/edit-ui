import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [handleGoHome, setHandleGoHome] = useState(() => () => {});

  return (
    <UIContext.Provider value={{ isCreateOpen, setCreateOpen, handleGoHome, setHandleGoHome }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
