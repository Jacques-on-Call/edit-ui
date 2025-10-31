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
        <h1 className={theme.typography.h1}>Easy-SEO v0.1</h1>
        <nav>
          <Link href="/" className="mr-4">Login</Link>
          <Link href="/repos" className="mr-4">Repos</Link>
          <Link href="/explorer">Explorer</Link>
        </nav>
      </header>

      {isLoading ? (
        <p>Loading application...</p>
      ) : (
        <Router>
          <LoginPage path="/" />
          <RepoSelectPage path="/repos" />
          <FileExplorerPage path="/explorer" />
        </Router>
      )}

      {/* Render the AuthDebugMonitor only in development */}
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
