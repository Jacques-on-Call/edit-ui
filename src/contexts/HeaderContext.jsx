// easy-seo/src/contexts/HeaderContext.jsx
import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';

const HeaderContext = createContext();

export const useHeader = () => useContext(HeaderContext);

export const HeaderProvider = ({ children }) => {
  const [headerContent, setHeaderContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const value = {
    headerContent,
    setHeaderContent,
    searchQuery,
    setSearchQuery,
  };

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
};
