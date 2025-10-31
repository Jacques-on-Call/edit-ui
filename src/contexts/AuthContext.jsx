import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

// 1. Create the context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  logout: () => {},
});

// 2. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to check the user's session
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const logout = async () => {
    // Perform logout by calling the backend API
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to login page is handled by the ProtectedRoute component
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
export const useAuth = () => {
  return useContext(AuthContext);
};
