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
  const hasInitialized = useRef(false);

  const selectRepo = (repo) => {
    setSelectedRepo(repo);
    // Persist to localStorage
    localStorage.setItem('selectedRepo', repo.full_name);
    console.log('[AuthContext] Selected repo saved:', repo.full_name);
  };

  const checkAuthStatus = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log('[AuthContext] Auth check already in progress, skipping');
      return;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);
    console.log(`[DEBUG-PREVIEW] Auth Check on route: ${window.location.pathname}`);
    console.log(`[DEBUG-PREVIEW] Loading state:`, true);

    try {
      const userData = await fetchJson('/api/me');
      setUser(userData);
      setIsAuthenticated(true);
      console.log(`[DEBUG-PREVIEW] User state:`, userData);

      const reposData = await fetchJson('/api/repos');
      setRepositories(reposData);
      return true;

    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      console.log(`[DEBUG-PREVIEW] User state:`, null);
      setUser(null);
      setIsAuthenticated(false);
      setRepositories([]);
      return false;
    } finally {
      setIsLoading(false);
      authCheckInProgress.current = false;
      console.log(`[DEBUG-PREVIEW] Loading state:`, false);
    }
  }, []);

  useEffect(() => {
    // Only run once on initial mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkAuthStatus();
    }
  }, []);

  // Load selected repo from localStorage on mount
  useEffect(() => {
    const savedRepo = localStorage.getItem('selectedRepo');
    if (savedRepo && repositories.length > 0) {
      // Find the full repo object from the repositories list
      const repoObj = repositories.find(r => r.full_name === savedRepo);
      if (repoObj) {
        setSelectedRepo(repoObj);
        console.log('[AuthContext] Restored repo from localStorage:', savedRepo);
      }
    }
  }, [repositories]);

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
