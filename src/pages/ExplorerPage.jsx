import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FileExplorer from '../components/FileExplorer';
import Icon from '../components/Icon';

function ExplorerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.authDebug.auth('ExplorerPage mounted, verifying user session');
    const verifyUser = async () => {
      try {
        const response = await fetch(`/api/me?t=${new Date().getTime()}`, {
          credentials: 'include',
          headers: { 'X-App-Version': 'jules-debug' }
        });
        if (!response.ok) {
          window.authDebug.warn('AUTH', 'Session verification failed, redirecting to login', { status: response.status });
          throw new Error('Not authenticated');
        }
        const userData = await response.json();
        window.authDebug.success('AUTH', 'Session verified successfully', userData);
        setUser(userData);
      } catch (error) {
        window.authDebug.error('AUTH', 'Error during session verification, redirecting to login', { message: error.message });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, [navigate]);

  const selectedRepo = location.state?.selectedRepo || localStorage.getItem('selectedRepo');
  window.authDebug.storage('GET', 'selectedRepo', selectedRepo);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <Icon name="loader" className="animate-spin h-12 w-12 mr-4" />
        Verifying session and loading explorer...
      </div>
    );
  }

  if (!user) {
    // This state should ideally not be reached due to the redirect in useEffect.
    return null;
  }

  if (!selectedRepo) {
    window.authDebug.warn('EXPLORER', 'No repository selected, rendering fallback UI.');
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">No Repository Selected</h1>
        <p className="text-gray-600 mb-8">Please go back to the repository selection page to choose a repository.</p>
        <Link
          to="/repository-selection"
          className="bg-bark-blue text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bark-blue transition-all"
        >
          Select a Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <div className="h-full">
        <FileExplorer repo={selectedRepo} />
      </div>
    </div>
  );
}

export default ExplorerPage;
