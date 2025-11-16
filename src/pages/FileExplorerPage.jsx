// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useUI } from '../contexts/UIContext';
import { useEffect, useState } from 'preact/hooks';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import FileExplorer from '../components/FileExplorer';
import { CreateModal } from '../components/CreateModal';
import { fetchJson } from '../lib/fetchJson';

export function FileExplorerPage() {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();
  const { searchQuery, setSearchQuery } = useHeader();
  const { isCreateOpen, setCreateOpen } = useUI();

  const [currentPath, setCurrentPath] = useState('src/pages');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Clear the search query when the component unmounts
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  // Fallback to localStorage if context is empty
  const repoName = selectedRepo?.full_name || localStorage.getItem('selectedRepo');

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
    window.location.href = '/';
    return null;
  }

  if (!repoName) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-2xl font-bold mb-4">No Repository Selected</h1>
        <button
          onClick={() => window.location.href = '/repo-select'}
          className="bg-accent-lime text-black px-6 py-3 rounded-lg font-bold"
        >
          Select a Repository
        </button>
      </div>
    );
  }

  const handleCreate = async (name, type) => {
    try {
      if (type === 'folder') {
        // Folder creation might still need a backend call.
        // For now, we'll just log it.
        console.log(`[FileExplorer] Folder creation not implemented for client-only drafts.`);
        alert('Folder creation is not supported in this version.');
        return;
      }

      const slug = name.replace(/\.[^/.]+$/, "");
      const initialContent = '---\ntitle: New Page\n---\n<h1>New Page</h1>';
      const draftPayload = {
        slug,
        content: initialContent,
        meta: { title: 'New Page' },
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(`easy-seo-draft:${slug}`, JSON.stringify(draftPayload));
      console.log(`[FileExplorer] createDraft -> slug: ${slug}`);

      setCreateOpen(false);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
    } catch (err) {
      console.error('Create draft error:', err);
      alert(`Failed to create draft: ${err.message}`);
    }
  };

  return (
    <div className="h-full">
      <FileExplorer 
        repo={repoName}
        searchQuery={searchQuery} // Pass the searchQuery from the context
        onPathChange={setCurrentPath}
        refreshTrigger={refreshTrigger}
      />

      <CreateModal
        isOpen={isCreateOpen}
        repo={repoName}
        path={currentPath}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
