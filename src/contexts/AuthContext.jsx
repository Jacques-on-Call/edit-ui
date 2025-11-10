// easy-seo/src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const authCheckInProgress = useRef(false);
  const hasInitialized = useRef(false); // NEW: Track initialization

  const selectRepo = (repo) => {
    setSelectedRepo(repo);
  };

  const checkAuthStatus = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log('[AuthContext] Auth check already in progress, skipping');
      return;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);

    try {
      const userData = await fetchJson('/api/me');
      setUser(userData);
      setIsAuthenticated(true);

      const reposData = await fetchJson('/api/repos');
      setRepositories(reposData);
      return true;

    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setRepositories([]);
      return false;
    } finally {
      setIsLoading(false);
      authCheckInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    // Only run once on initial mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkAuthStatus();
    }
  }, []); // Empty deps - only run on mount/unmount

  const value = { user, isAuthenticated, isLoading, repositories, selectedRepo, selectRepo, checkAuthStatus };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
