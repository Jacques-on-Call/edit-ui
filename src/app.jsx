// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderProvider, useHeader } from './contexts/HeaderContext';
import { theme } from './themes/theme';
// Trivial change to force frontend redeployment
import { Router, useRouter } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import ContentEditorPage from './pages/ContentEditorPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor';
import { BottomToolbar } from './components/BottomToolbar';
import SearchBar from './components/SearchBar'; // Import SearchBar
import { FloatingLogButton } from './components/DebugLogButton.jsx';

const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { headerContent, searchQuery, setSearchQuery } = useHeader();
  const [router] = useRouter();

  console.log(`[App.jsx] render - searchQuery: "${searchQuery}"`);
  console.trace('[App.jsx] render trace');

  const isLoginPage = !isAuthenticated && router.url === '/';
  const isExplorerLayout = router.url.startsWith('/explorer');
  const isEditorLayout = router.url.startsWith('/editor');

  // Editor needs a full-bleed layout, explorer is flex-col, others are padded
  const mainLayoutClasses = isEditorLayout
    ? 'h-screen text-text'
    : isExplorerLayout
    ? 'relative h-screen flex flex-col text-text overflow-hidden'
    : 'relative min-h-screen text-text';

  const mainContentClasses = isEditorLayout
    ? 'h-full'
    : isExplorerLayout
    ? 'relative z-10 flex-grow overflow-y-auto'
    : `relative z-10 ${isLoginPage ? '' : 'p-6 md:p-10'}`;

  return (
    <div className={mainLayoutClasses} style={{ fontFamily: theme.typography.fontFamily }}>
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-midnight-blue via-gradient-start to-black animate-pulse-bg">
        <div className="orb orb-white orb-1"></div>
        <div className="orb orb-white orb-2"></div>
        <div className="orb orb-white orb-3"></div>
      </div>

      {/* Hide global header on editor page; it has its own */}
      {!isEditorLayout && (
        <header className={isExplorerLayout ? 'relative z-10 flex-shrink-0 p-6 md:p-10 flex justify-between items-center h-24' : 'flex justify-between items-center pb-8 h-16'}>
          {isExplorerLayout ? <SearchBar onSearch={setSearchQuery} /> : headerContent}
        </header>
      )}

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
            <ContentEditorPage path="/editor/:pageId" />
            <LoginPage default />
          </Router>
        )}
      </main>

      {isExplorerLayout && <BottomToolbar />}

      <FloatingLogButton />
      {import.meta.env.DEV && <AuthDebugMonitor />}
    </div>
  );
};

import { UIProvider } from './contexts/UIContext';

export function App() {
  return (
    <AuthProvider>
      <HeaderProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </HeaderProvider>
    </AuthProvider>
  );
}
