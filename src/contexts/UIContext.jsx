import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isCreateOpen, setCreateOpen] = useState(false);

  return (
    <UIContext.Provider value={{ isCreateOpen, setCreateOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
