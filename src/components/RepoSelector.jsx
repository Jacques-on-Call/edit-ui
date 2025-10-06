import { useState, useEffect } from 'react';

function RepoSelector({ onRepoSelect }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/repos', {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to fetch repositories. Please try logging out and back in.');
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
    return <div className="text-center text-white/70 animate-pulse">Loading repositories...</div>;
  }

  if (error) {
    return <div className="text-center text-red-100 bg-red-500/30 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-12 text-center">Select a Repository</h2>
      <ul className="space-y-4">
        {repos.map(repo => (
          <li
            key={repo.id}
            onClick={() => onRepoSelect(repo.full_name)}
            className="p-5 bg-white/10 border border-white/20 rounded-xl cursor-pointer hover:bg-white/20 backdrop-blur-sm transition-all duration-300 ease-in-out"
          >
            <span className="font-semibold text-lg text-white">{repo.full_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoSelector;