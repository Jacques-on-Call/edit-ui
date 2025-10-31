// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';

export function FileExplorerPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h2 className={theme.typography.h2}>Access Denied</h2>
        <p className="text-textSecondary mt-2">You must be logged in to view the file explorer.</p>
      </div>
    );
  }

  return (
    <div className="pt-12">
      <h2 className={theme.typography.h2}>File Explorer</h2>
      <p className="text-textSecondary mt-2">
        Files and folders for the selected repository will be displayed here.
      </p>

      {/* Placeholder for the file explorer */}
      <div className="mt-8 bg-surface p-8 rounded-lg">
        <p className="text-textSecondary">File list will be displayed here.</p>
      </div>
    </div>
  );
}
