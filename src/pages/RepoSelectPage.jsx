// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github, AlertTriangle } from 'lucide-preact';
import { route } from 'preact-router';

export function RepoSelectPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading user data...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h2 className={theme.typography.h2}>Access Denied</h2>
        <p className="text-textSecondary mt-2">You must be logged in to select a repository.</p>
      </div>
    );
  }

  const { repositories, selectRepo } = useAuth();

  const handleSelectRepo = (repo) => {
    selectRepo(repo);
    route('/explorer');
  };

  return (
    <div className="pt-12 px-4">
      <h2 className={theme.typography.h2}>Select a Repository</h2>
      <p className="text-textSecondary mt-2">
        Welcome, <span className="font-bold text-accent">{user?.login}</span>. Choose a repository to start editing.
      </p>

      <div className="mt-8 flex flex-col items-center gap-8">
        {repositories.length > 0 ? (
          repositories.map((repo) => (
            <button
              key={repo.id}
              className="w-full max-w-md bg-surface p-6 rounded-lg border-b-2 border-r-2 border-border hover:border-accent transition-all shadow-xl hover:shadow-2xl text-left transform hover:-translate-y-1"
              onClick={() => handleSelectRepo(repo)}
            >
              <h3 className="font-bold text-lg text-accent">{repo.name}</h3>
            </button>
          ))
        ) : (
          <p className="text-textSecondary">No repositories found.</p>
        )}
      </div>
    </div>
  );
}
