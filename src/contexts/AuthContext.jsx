// easy-seo/src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'preact/compat';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const selectRepo = (repo) => {
    setSelectedRepo(repo);
    // Optionally, persist to localStorage if needed
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/me', {
          credentials: 'include', // Important: ensures the gh_session cookie is sent
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);

          // If authenticated, fetch repositories
          try {
            const reposResponse = await fetch('/api/repos', { credentials: 'include' });
            if (reposResponse.ok) {
              const reposData = await reposResponse.json();
              setRepositories(reposData);
            }
          } catch (reposError) {
            console.error('Failed to fetch repositories:', reposError);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const value = { user, isAuthenticated, isLoading, repositories, selectedRepo, selectRepo };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
