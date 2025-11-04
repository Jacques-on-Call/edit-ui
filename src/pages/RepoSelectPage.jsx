// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import { route } from 'preact-router';

export function RepoSelectPage() {
  const { user, isAuthenticated, isLoading, repositories, selectRepo } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading user data...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    route('/login', true);
    return null;
  }

  const handleSelectRepo = (repo) => {
    selectRepo(repo);
    route('/explorer');
  };

  return (
    <div className="pt-12 px-4 text-center">
      <img src="/logo.webp" alt="Easy SEO Logo" className="w-24 h-24 mx-auto mb-4" />
      <h1 className="text-5xl font-bold">Easy SEO</h1>
      <h2 className={theme.typography.h2_alternative}>Select a Repository</h2>
      <p className="text-textSecondary mt-2">
        Welcome, <span className="font-bold text-accent">{user?.login}</span>. Choose a repository to start editing.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        {repositories.length > 0 ? (
          repositories.map((repo) => (
            <div key={repo.id} className="w-full max-w-md">
              <button
                className="w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-800 to-blue-900 p-6 rounded-lg border border-blue-200 hover:border-accent transition-all shadow-lg hover:shadow-2xl text-left transform hover:-translate-y-1"
                onClick={() => handleSelectRepo(repo)}
              >
                <h3 className="font-bold text-lg text-white text-center">{repo.name}</h3>
              </button>
            </div>
          ))
        ) : (
          <p className="text-textSecondary">No repositories found.</p>
        )}
      </div>
    </div>
  );
}
