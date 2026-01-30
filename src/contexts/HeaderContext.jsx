import { createContext, useContext, useState, useMemo } from 'preact/compat';

// 1. Create the context
const HeaderContext = createContext();

// 2. Create the Provider component
export const HeaderProvider = ({ children }) => {
  const [headerContent, setHeaderContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Memoize the context value
  // This is the critical change. By using useMemo, we ensure that the
  // context 'value' object only gets a new identity when one of its
  // dependencies (like searchQuery) changes. This will correctly trigger
  // re-renders in all components that use this context.
  const value = useMemo(() => ({
    headerContent,
    setHeaderContent,
    searchQuery,
    setSearchQuery,
  }), [headerContent, searchQuery]); // Add all state values to dependency array

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
};

// 4. Create the custom hook for easy consumption
export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
