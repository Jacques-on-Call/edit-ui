// easy-seo/src/contexts/HeaderContext.jsx
import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';

const HeaderContext = createContext();

export const useHeader = () => useContext(HeaderContext);

export const HeaderProvider = ({ children }) => {
  const [headerContent, setHeaderContent] = useState(null);

  return (
    <HeaderContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContext.Provider>
  );
};
