import { useState, useEffect } from 'react';

function RepoSelector({ onRepoSelect }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/repos', {
      credentials: 'include',
    })
    .then(async res => {
      if (res.ok) {
        return res.json();
      }
      // If the response is not ok, parse the JSON error body from the worker
      const errorData = await res.json();
      throw new Error(errorData.message || 'An unknown error occurred while fetching repositories.');
    })
    .then(data => {
      // If there's only one repository, select it automatically.
      if (data && data.length === 1) {
        onRepoSelect(data[0].full_name);
      } else {
        setRepos(data);
        setLoading(false);
      }
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [onRepoSelect]);

  if (loading) {
    return <div className="text-center text-white/70 animate-pulse">Loading repositories...</div>;
  }

  if (error) {
    return <div className="text-center text-red-100 bg-red-500/30 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Select a Repository</h2>
      <ul className="space-y-3">
        {repos.map(repo => (
          <li
            key={repo.id}
            onClick={() => onRepoSelect(repo.full_name)}
            className="p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 backdrop-blur-sm transition-all duration-300 ease-in-out"
          >
            <span className="font-medium text-base text-white">{repo.full_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoSelector;