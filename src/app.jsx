// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './themes/theme';
import { Router, useRouter } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor'; // Corrected import

const AppContent = () => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [router] = useRouter();
  const currentPath = router.url;

  return (
    <div
      className="relative min-h-screen text-text"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-gradient-start via-midnight-blue to-black animate-pulse-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <main className="relative z-10 p-6 md:p-10">
        <header className="flex justify-between items-center pb-8">
          {isAuthenticated && user && currentPath !== '/explorer' ? (
            <div className="flex items-center gap-4">
              <img src={user.avatar_url} alt="User Avatar" className="w-10 h-10 rounded-full" />
              <span className="font-bold">{user.login}</span>
            </div>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading application...</p>
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
