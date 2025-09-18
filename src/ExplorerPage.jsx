import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileExplorer from './FileExplorer';

function ExplorerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const selectedRepo = localStorage.getItem('selectedRepo');

  useEffect(() => {
    fetch('/api/me', {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Not authenticated');
    })
    .then(userData => {
      if (userData && userData.login) {
        setUser(userData);
      }
      setLoading(false);
    })
    .catch(() => {
      navigate('/');
    });

    if (!selectedRepo) {
      navigate('/');
    }
  }, [navigate, selectedRepo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // This can happen briefly before the redirect.
    // Or if the /api/me call fails.
    return <div>Authenticating...</div>;
  }

  return <FileExplorer repo={selectedRepo} />;
}

export default ExplorerPage;
