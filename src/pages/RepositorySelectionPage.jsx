import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RepoSelector from '../components/RepoSelector';
import Icon from '../components/Icon';

function RepositorySelectionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [navigate]);

  const handleRepoSelect = (repo) => {
    localStorage.setItem('selectedRepo', repo);
    navigate('/explorer?path=src/pages', { state: { selectedRepo: repo } });
  };

  if (loading) {
    return (
      <div className="bg-bark-blue min-h-screen flex flex-col items-center justify-center text-white">
        <Icon name="loader" className="animate-spin h-12 w-12 mb-4" />
        <p>Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    // This case is mostly handled by the redirect in useEffect, but it's good practice.
    return null;
  }

  return (
    <div className="bg-bark-blue min-h-screen flex flex-col items-center justify-center py-12 text-center">
      <div className="max-w-2xl w-full px-4">
        <img src="/logo.webp" className="h-20 w-auto mx-auto mb-8" alt="Easy SEO Logo" />
        <RepoSelector onRepoSelect={handleRepoSelect} />
      </div>
    </div>
  );
}

export default RepositorySelectionPage;
