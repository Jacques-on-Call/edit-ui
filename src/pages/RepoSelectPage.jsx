// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github, AlertTriangle } from 'lucide-preact';

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

  return (
    <div className="pt-12">
      <h2 className={theme.typography.h2}>Select a Repository</h2>
      <p className="text-textSecondary mt-2">
        Welcome, <span className="font-bold text-accent">{user?.login}</span>. Choose a repository to start editing.
      </p>

      {/* Placeholder for the repository list */}
      <div className="mt-8 bg-surface p-8 rounded-lg">
        <p className="text-textSecondary">Repository list will be displayed here.</p>
      </div>
    </div>
  );
}
