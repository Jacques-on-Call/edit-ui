import { Outlet, Link, useLocation } from 'react-router-dom';
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
        <Link to="/preview" className="text-gray-600 hover:text-gray-800">Preview</Link>
      </div>
    </nav>
  </header>
);

function AppLayout() {
  const location = useLocation();
  const isExplorerPage = location.pathname.startsWith('/explorer');
  const isEditorPage = location.pathname.startsWith('/editor');

  const renderHeader = () => {
    if (isExplorerPage) return <ExplorerHeader />;
    if (isEditorPage) return null; // No header for the editor page
    return <DefaultHeader />;
  };

  return (
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