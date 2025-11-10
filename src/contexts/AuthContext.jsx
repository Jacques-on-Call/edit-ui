// easy-seo/src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'preact/compat';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);

  // NEW: Prevent concurrent auth checks
  const authCheckInProgress = useRef(false);

  const selectRepo = (repo) => {
    setSelectedRepo(repo);
  };

  const checkAuthStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (authCheckInProgress.current) {
      console.log('[AuthContext] Auth check already in progress, skipping');
      return;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);

    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);

        const reposResponse = await fetch('/api/repos', { credentials: 'include' });
        if (reposResponse.ok) {
          setRepositories(await reposResponse.json());
        }
        return true;
      } else {
        console.warn('[AuthContext] /api/me returned', response.status);
        setUser(null);
        setIsAuthenticated(false);
        setRepositories([]);
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setRepositories([]);
    } finally {
      setIsLoading(false);
      authCheckInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []); // Empty deps - only run once on mount

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
