// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github, AlertTriangle } from 'lucide-preact';
import { useRouter } from 'preact-router';

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
  const router = useRouter();

  const handleSelectRepo = (repo) => {
    selectRepo(repo);
    router.route('/explorer');
  };

  return (
    <div className="pt-12">
      <h2 className={theme.typography.h2}>Select a Repository</h2>
      <p className="text-textSecondary mt-2">
        Welcome, <span className="font-bold text-accent">{user?.login}</span>. Choose a repository to start editing.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repositories.length > 0 ? (
          repositories.map((repo) => (
            <div
              key={repo.id}
              className="bg-surface p-6 rounded-lg border border-border hover:border-accent transition-colors shadow-md hover:shadow-lg flex flex-col"
              onClick={() => handleSelectRepo(repo)}
            >
              <h3 className="font-bold text-lg text-accent">{repo.name}</h3>
              <p className="text-textSecondary text-sm mt-2 flex-grow">{repo.description || 'No description available.'}</p>
              <div className="flex items-center text-xs text-textSecondary mt-4">
                <span className="mr-4">{repo.language}</span>
                <span className="flex items-center" title="GitHub Stars">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  {repo.stargazers_count}
                </span>
              </div>
              <button
                className="mt-6 w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors"
              >
                Select
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
