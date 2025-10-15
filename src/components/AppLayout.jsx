import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import ExplorerHeader from './ExplorerHeader';

const DefaultHeader = () => (
  <header className="bg-light-grey shadow-md">
    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2">
        <img src="/logo.webp" alt="Easy SEO Logo" className="h-10 w-auto" />
        <span className="text-2xl font-bold text-gray-800">Easy SEO</span>
      </Link>
      <div className="flex items-center space-x-4">
        <Link to="/explorer" className="text-gray-600 hover:text-gray-800">Explorer</Link>
        <Link to="/layouts" className="text-gray-600 hover:text-gray-800">Layouts</Link>
        <Link to="/preview" className="text-gray-600 hover:text-gray-800">Preview</Link>
      </div>
    </nav>
  </header>
);

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        // If the session is invalid (e.g., 401 Unauthorized), redirect to login
        setIsAuthenticated(false);
        navigate('/login');
        return null;
      })
      .then(userData => {
        if (userData && userData.login) {
          setIsAuthenticated(true);
          // NEW: Check for repository selection *after* confirming authentication
          const selectedRepo = localStorage.getItem('selectedRepo');
          if (!selectedRepo && location.pathname !== '/repository-selection') {
            navigate('/repository-selection');
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        navigate('/login');
      });
  }, [navigate, location.pathname]);

  const isExplorerPage = location.pathname.startsWith('/explorer');
  const isEditorPage = location.pathname.startsWith('/editor');

  const renderHeader = () => {
    if (isExplorerPage) return <ExplorerHeader />;
    if (isEditorPage) return null; // No header for the editor page
    return <DefaultHeader />;
  };

  // While checking authentication, show a loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the layout
  return isAuthenticated && (
    <div className="min-h-screen flex flex-col">
      {renderHeader()}

      <main className="flex-grow h-full">
        <Outlet />
      </main>

      <footer className="bg-bark-blue text-white">
        <div className="container mx-auto px-6 py-8 text-center">
          <p>&copy; {new Date().getFullYear()} Easy SEO. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;