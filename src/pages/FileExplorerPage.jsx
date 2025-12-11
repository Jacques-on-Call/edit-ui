// easy-seo/src/pages/FileExplorerPage.jsx
import { route } from 'preact-router';
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

  const [currentPath, setCurrentPath] = useState('content/pages');
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
        console.log(`[FileExplorer] Folder creation not implemented.`);
        alert('Folder creation is not supported in this version.');
        return;
      }

      // 1. Prepare file names and paths
      const fileName = name.endsWith('.json') ? name.replace(/\.json$/, '') : name;
      const slug = fileName;
      const jsonPath = `content/pages/_${slug}.json`;
      const astroPath = `src/pages/json-preview/_${slug}.astro`;

      // 2. Create the JSON content payload
      const pageData = {
        slug,
        meta: { title: slug },
        sections: [
          {
            id: `section-${Date.now()}`,
            type: 'hero',
            props: {
              title: '',
              subtitle: '',
              body: '',
            },
          },
        ],
      };

      // 3. Call the backend to create the .json file
      const jsonResponse = await fetchJson('/api/page-json/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, pageData }),
      });

      if (!jsonResponse) {
         throw new Error('Failed to create JSON file on the server.');
      }
      console.log('Successfully created JSON file:', jsonResponse);


      // 4. Create the Astro file content, pointing to the new JSON file
      const astroContent = `---
import MainLayout from '../../layouts/MainLayout.astro';
import PageRenderer from '../../components/PageRenderer.astro';
import pageData from '../../../${jsonPath}';
---
<MainLayout title={pageData.meta.title}>
  <PageRenderer page={pageData} />
</MainLayout>
`;

      // 5. Call the backend to create the .astro file
      const astroResponse = await fetchJson('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              repo: repoName,
              path: astroPath,
              content: astroContent,
              message: `feat: create new page ${slug}`
          })
      });

      if (!astroResponse) {
          throw new Error('Failed to create Astro file on the server.');
      }
      console.log('Successfully created Astro file:', astroResponse);


      // 6. Success: close modal, trigger refresh, and navigate
      setCreateOpen(false);
      setRefreshTrigger(prev => prev + 1);
      route(`/editor/${encodeURIComponent(astroPath)}`);

    } catch (err) {
      console.error('Create file error:', err);
      alert(`Failed to create file: ${err.message}`);
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
