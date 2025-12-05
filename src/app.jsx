// easy-seo/src/app.jsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderProvider, useHeader } from './contexts/HeaderContext';
import { theme } from './themes/theme';
import { Router, useRouter } from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { RepoSelectPage } from './pages/RepoSelectPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import ContentEditorPage from './pages/ContentEditorPage';
import { CallbackPage } from './pages/CallbackPage';
import AuthDebugMonitor from './components/AuthDebugMonitor';
import { BottomToolbar } from './components/BottomToolbar';
import SearchBar from './components/SearchBar';
import { FloatingLogButton } from './components/DebugLogButton.jsx';

const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { headerContent, searchQuery, setSearchQuery } = useHeader();
  const [router] = useRouter();

  const isEditorLayout = router.url.startsWith('/editor');
  const isExplorerLayout = router.url.startsWith('/explorer');

  // Define base layout classes
  const layoutContainerClasses = "max-w-5xl mx-auto shadow-2xl text-text";
  let mainLayoutClasses = `relative ${layoutContainerClasses}`;
  let mainContentClasses = "relative z-10 p-6 md:p-10";

  if (isEditorLayout) {
    mainLayoutClasses += " h-full flex flex-col";
    mainContentClasses = "h-full";
  } else if (isExplorerLayout) {
    mainLayoutClasses += " h-screen flex flex-col overflow-hidden";
    mainContentClasses = "relative z-10 flex-grow overflow-y-auto";
  } else {
    mainLayoutClasses += " min-h-screen";
  }

  return (
    <>
      {/* Animated background is now a standalone sibling, completely separate from the content wrapper */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-midnight-blue via-gradient-start to-black animate-pulse-bg">
        <div className="orb orb-white orb-1"></div>
        <div className="orb orb-white orb-2"></div>
        <div className="orb orb-white orb-3"></div>
      </div>

      {/* Main content wrapper - NO transform or filter properties */}
      <div className={mainLayoutClasses} style={{ fontFamily: theme.typography.fontFamily }}>
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
      </div>

      {/* Debug tools are also rendered at the root, outside the main layout wrapper */}
      {import.meta.env.DEV && <FloatingLogButton />}
      {import.meta.env.DEV && <AuthDebugMonitor />}
    </>
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
