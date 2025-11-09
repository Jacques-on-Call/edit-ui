// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useEffect, useState } from 'preact/hooks';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import { route } from 'preact-router';
import FileExplorer from '../components/FileExplorer';
import SearchBar from '../components/SearchBar';
import CreateModal from '../components/CreateModal'; // add or ensure this exists

export function FileExplorerPage() {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();
  const { setHeaderContent } = useHeader();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setHeaderContent(<SearchBar onSearch={setSearchQuery} />);
    // Clear the header when the component unmounts
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    route('/login', true);
    return null;
  }

  if (!selectedRepo) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h2 className={theme.typography.h2}>No Repository Selected</h2>
        <p className="text-textSecondary mt-2">Please go back and select a repository to view its files.</p>
        <button onClick={() => route('/repo-select')} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded">
          Select Repository
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <FileExplorer repo={selectedRepo.full_name} searchQuery={searchQuery}
        onShowCreate={() => setCreateOpen(true)}
      />

      {isCreateOpen && (
        <CreateModal
          repo={selectedRepo.full_name}
          path="/" // or current folder
          onClose={() => setCreateOpen(false)}
          onCreate={() => {
            setCreateOpen(false);
            // refresh file list (FileExplorer should accept a refresh trigger)
          }}
        />
      )}
    </div>
  );
}
