// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './themes/theme';
import { Router, Link } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import AuthDebugMonitor from './components/AuthDebugMonitor'; // Corrected import

const AppContent = () => {
  const { isLoading } = useAuth();

  return (
    <div className="bg-background text-text min-h-screen p-8" style={{ fontFamily: theme.typography.fontFamily }}>
      <header className="flex justify-between items-center pb-8">
        <div className="flex items-center gap-4">
          <h1 className={theme.typography.h1}>Easy-SEO</h1>
          <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full">Now Available</span>
        </div>
        <p className="text-sm text-textSecondary">A Strategy Content Agency Tool</p>
      </header>

      {isLoading ? (
        <p>Loading application...</p>
      ) : (
        <Router>
          <LoginPage path="/" />
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
