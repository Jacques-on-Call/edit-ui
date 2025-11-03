// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Router, Link } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor'; // Corrected import

const AppContent = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  return (
    <div className="bg-background text-text min-h-screen p-6 md:p-10">
      <header className="flex justify-between items-center pb-8">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            <img src={user.avatar_url} alt="User Avatar" className="w-10 h-10 rounded-full" />
            <span className="font-bold">{user.login}</span>
          </div>
        ) : (
          <div></div> // Empty div to maintain layout
        )}
      </header>

      {isLoading ? (
        <p>Loading application...</p>
      ) : (
        <Router>
          <LoginPage path="/" />
          <CallbackPage path="/login" />
          <RepoSelectPage path="/repo-select" />
          <FileExplorerPage path="/explorer" />
        </Router>
      )}

      {import.meta.env.DEV && <AuthDebugMonitor />}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
