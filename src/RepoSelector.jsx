import { useState, useEffect } from 'react';

function RepoSelector({ onRepoSelect }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/repos`, {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to fetch repositories');
    })
    .then(data => {
      setRepos(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading repositories...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="repo-selector">
      <h2>Select a Repository</h2>
      <ul>
        {repos.map(repo => (
          <li key={repo.id} onClick={() => onRepoSelect(repo.full_name)}>
            {repo.full_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoSelector;
