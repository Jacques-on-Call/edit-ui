// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderProvider, useHeader } from './contexts/HeaderContext';
import { theme } from './themes/theme';
import { Router, useRouter } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor'; // Corrected import

const AppContent = () => {
  const { isLoading } = useAuth();
  const { headerContent } = useHeader();

  return (
    <div
      className="relative min-h-screen text-text"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-midnight-blue via-gradient-start to-black animate-pulse-bg">
        <div className="orb orb-white orb-1"></div>
        <div className="orb orb-white orb-2"></div>
        <div className="orb orb-white orb-3"></div>
      </div>

      <main className="relative z-10 p-6 md:p-10">
        <header className="flex justify-between items-center pb-8 h-16">
          {headerContent || <div></div>}
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
      <HeaderProvider>
        <AppContent />
      </HeaderProvider>
    </AuthProvider>
  );
}
