import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';

export const HeaderContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  headerContent: null,
  setHeaderContent: () => {}
});

export const useHeader = () => useContext(HeaderContext);

export function HeaderProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [headerContent, setHeaderContent] = useState(null);

  return (
    <HeaderContext.Provider value={{ searchQuery, setSearchQuery, headerContent, setHeaderContent }}>
      {children}
    </HeaderContext.Provider>
  );
}
