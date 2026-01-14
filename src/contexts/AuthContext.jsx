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
  }, []);

  // Load selected repo from localStorage on mount
  useEffect(() => {
    const savedRepoName = localStorage.getItem('selectedRepo');
    if (savedRepoName) {
      // Restore the repo object immediately from what we have in localStorage.
      // The full object is not strictly necessary for many API calls, which only need `full_name`.
      // The full, up-to-date repo object will be set later by the effect that depends on `repositories`.
      setSelectedRepo({ full_name: savedRepoName });
      console.log('[AuthContext] Immediately restored repo name from localStorage:', savedRepoName);
    }
  }, []); // Run only once on initial mount

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
