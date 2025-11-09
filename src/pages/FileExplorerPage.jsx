// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useEffect, useState } from 'preact/hooks';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import { route } from 'preact-router';
import FileExplorer from '../components/FileExplorer';
import SearchBar from '../components/SearchBar';
import CreateModal from '../components/CreateModal';
import { fetchJson } from '../lib/fetchJson';

export function FileExplorerPage() {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();
  const { setHeaderContent } = useHeader();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('src/pages');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handleCreate = async (name, type) => {
    try {
      const fullPath = `${currentPath}/${name}`;
      let body = { repo: selectedRepo.full_name, path: fullPath, type };

      // For files, add some default, base64 encoded content
      if (type === 'file') {
        try {
          const templateUrl = `/api/files?repo=${encodeURIComponent(selectedRepo.full_name)}&path=${encodeURIComponent('src/pages/_template.astro')}`;
          const templateData = await fetchJson(templateUrl);
          const content = atob(templateData.content);
          body.content = btoa(content);
        } catch (err) {
          console.error('Template fetch error:', err);
          // Continue without template
          body.content = btoa('---\ntitle: New Page\n---\n<h1>New Page</h1>');
        }
      }

      await fetchJson('/api/files', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setCreateOpen(false);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
    } catch (err) {
      console.error('Create error:', err);
      alert(`Failed to create item: ${err.message}`);
    }
  };

  return (
    <div className="h-screen">
      <FileExplorer 
        repo={selectedRepo.full_name} 
        searchQuery={searchQuery}
        onShowCreate={() => setCreateOpen(true)}
        onPathChange={setCurrentPath}
        refreshTrigger={refreshTrigger}
      />

      <CreateModal
        isOpen={isCreateOpen}
        repo={selectedRepo.full_name}
        path={currentPath}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
