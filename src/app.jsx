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
import { BottomToolbar } from './components/BottomToolbar';
import SearchBar from './components/SearchBar'; // Import SearchBar

const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { headerContent, searchQuery, setSearchQuery } = useHeader();
  const [router] = useRouter();

  console.log(`[App.jsx] searchQuery from context: "${searchQuery}"`);

  const isLoginPage = !isAuthenticated && router.url === '/';
  const isExplorerLayout = router.url.startsWith('/explorer');

  const mainLayoutClasses = isExplorerLayout
    ? 'relative h-screen flex flex-col text-text overflow-hidden'
    : 'relative min-h-screen text-text';

  const mainContentClasses = isExplorerLayout
    ? 'relative z-10 flex-grow overflow-y-auto'
    : `relative z-10 ${isLoginPage ? '' : 'p-6 md:p-10'}`;

  return (
    <div className={mainLayoutClasses} style={{ fontFamily: theme.typography.fontFamily }}>
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-midnight-blue via-gradient-start to-black animate-pulse-bg">
        <div className="orb orb-white orb-1"></div>
        <div className="orb orb-white orb-2"></div>
        <div className="orb orb-white orb-3"></div>
      </div>

      <header className={isExplorerLayout ? 'relative z-10 flex-shrink-0 p-6 md:p-10 flex justify-between items-center h-24' : 'flex justify-between items-center pb-8 h-16'}>
        {isExplorerLayout ? <SearchBar onSearch={setSearchQuery} /> : headerContent}
      </header>

      <main className={mainContentClasses}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-lime"></div>
          </div>
        ) : (
          <Router>
            <CallbackPage path="/" />
            <RepoSelectPage path="/repo-select" />
            <FileExplorerPage path="/explorer" />
            <LoginPage default />
          </Router>
        )}
      </main>

      {isExplorerLayout && <BottomToolbar />}

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
