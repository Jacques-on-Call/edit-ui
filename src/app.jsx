// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './themes/theme';
import { Router } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor';

const AppContent = () => {
  const { isLoading } = useAuth();

  return (
    <div className="bg-background text-text min-h-screen" style={{ fontFamily: theme.typography.fontFamily }}>
      {/* The header is now a simple placeholder, ensuring a consistent auth shell without displaying user info */}
      <header className="h-4 bg-background"></header>

      <main className="p-6 md:p-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : (
          <Router>
            <LoginPage path="/" />
            <CallbackPage path="/login" />
            <RepoSelectPage path="/repo-select" />
            <FileExplorerPage path="/explorer" />
          </Router>
        )}
      </main>

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
