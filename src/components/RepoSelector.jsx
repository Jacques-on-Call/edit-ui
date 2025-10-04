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
    return <div className="text-center text-gray-500 animate-pulse">Loading repositories...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Select a Repository</h2>
      <ul className="space-y-4">
        {repos.map(repo => (
          <li
            key={repo.id}
            onClick={() => onRepoSelect(repo.full_name)}
            className="p-5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 ease-in-out"
          >
            <span className="font-semibold text-lg text-gray-700">{repo.full_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoSelector;