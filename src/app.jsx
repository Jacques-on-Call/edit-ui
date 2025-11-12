// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderProvider, useHeader } from './contexts/HeaderContext';
import { theme } from './themes/theme';
import { Router, useRouter } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor';

import SearchBar from './components/SearchBar'; // Import SearchBar

const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { headerContent, searchQuery, setSearchQuery } = useHeader();
  const [router] = useRouter();

  console.log(`[App.jsx] searchQuery from context: "${searchQuery}"`);

  // Determine if the current route is the main login page (and not a callback)
  const isLoginPage = !isAuthenticated && router.url === '/';
  const showSearchBar = router.url.startsWith('/explorer');

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

      <main className={`relative z-10 ${isLoginPage ? '' : 'p-6 md:p-10'}`}>
        <header className="flex justify-between items-center pb-8 h-16">
          {showSearchBar ? (
            <SearchBar onSearch={setSearchQuery} />
          ) : (
            headerContent
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-full pt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-lime"></div>
          </div>
        ) : (
          <Router>
            {/* The CallbackPage now handles the root path and decides where to go. */}
            <CallbackPage path="/" />
            <RepoSelectPage path="/repo-select" />
            <FileExplorerPage path="/explorer" />
            {/* Add a default route for any invalid paths */}
            <LoginPage default />
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
