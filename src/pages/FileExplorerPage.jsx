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
        console.log(`[FileExplorer] Folder creation not implemented.`);
        alert('Folder creation is not supported in this version.');
        return;
      }

      // 1. Prepare file names and paths
      const fileName = name.replace(/\.(astro|json)$/, '');
      const slug = fileName;

      // Determine the relative path from either `src/pages` or `content/pages`
      let relativePath = '';
      if (currentPath.startsWith('src/pages')) {
        relativePath = currentPath.substring('src/pages'.length);
      } else if (currentPath.startsWith('content/pages')) {
        relativePath = currentPath.substring('content/pages'.length);
      }

      // Ensure relativePath is consistent (e.g., starts with '/' or is empty)
      const pathSuffix = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      const cleanSuffix = pathSuffix === '/' ? '' : pathSuffix.replace(/\/$/, ''); // handle root and remove trailing slash

      const jsonPath = `content/pages${cleanSuffix}/_${slug}.json`;
      const astroPath = `src/pages${cleanSuffix}/_${slug}.astro`;

      // 2. Create the JSON content payload
      const pageData = {
        slug,
        meta: { title: slug },
        sections: [
          {
            id: `section-${Date.now()}`,
            type: 'hero',
            props: { title: '', subtitle: '', body: '' },
          },
        ],
      };

      // 3. Call the backend to create the .json file
      const jsonContent = JSON.stringify(pageData, null, 2);
      const jsonResponse = await fetchJson('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoName,
          path: jsonPath,
          content: jsonContent,
          message: `feat: create new data file for ${slug}`
        }),
      });

      if (!jsonResponse) {
         throw new Error('Failed to create JSON file on the server.');
      }

      // 4. Create the Astro file content with robust relative paths
      const astroDir = astroPath.substring(0, astroPath.lastIndexOf('/'));
      const astroDirDepth = astroDir.split('/').length;
      const dataPath = '../'.repeat(astroDirDepth) + jsonPath;

      const astroContent = `---
import MainLayout from '~/layouts/MainLayout.astro';
import PageRenderer from '~/components/PageRenderer.astro';
import pageData from '${dataPath}';
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
