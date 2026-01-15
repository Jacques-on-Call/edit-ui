// easy-seo/src/pages/FileExplorerPage.jsx
import { route } from 'preact-router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useUI } from '../contexts/UIContext';
import { useEffect, useState } from 'preact/hooks';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import FileExplorer from '../components/FileExplorer';
import CreatePageModal from '../components/CreatePageModal';
import BottomActionBar from '../components/BottomActionBar';
import { fetchJson } from '../lib/fetchJson';

export function FileExplorerPage() {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();
  const { searchQuery, setSearchQuery } = useHeader();
  const { isCreateOpen, setCreateOpen, currentPath, setCurrentPath } = useUI();

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

  const { logout } = useAuth();
  if (!repoName) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-2xl font-bold mb-4">No Repository Selected</h1>
        <p className="mb-4">Please select a repository to continue, or if you're stuck, try logging out.</p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/repo-select'}
            className="bg-accent-lime text-black px-6 py-3 rounded-lg font-bold"
          >
            Select a Repository
          </button>
          <button
            onClick={logout}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async (pageName, designType) => {
    try {
      const fileName = pageName.replace(/\s+/g, '-').toLowerCase();
      const slug = fileName;

      let relativePath = '';
      if (currentPath.startsWith('src/pages')) {
        relativePath = currentPath.substring('src/pages'.length);
      } else if (currentPath.startsWith('content/pages')) {
        relativePath = currentPath.substring('content/pages'.length);
      }

      const pathSuffix = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      const cleanSuffix = pathSuffix === '/' ? '' : pathSuffix.replace(/\/$/, '');

      if (designType === 'Contact') {
        const astroPath = `src/pages${cleanSuffix}/${slug}.astro`;
        const astroContent = `---
import MainLayout from '~/layouts/MainLayout.astro';
import SmartForm from '~/components/SmartForm.astro';
---
<MainLayout title="${pageName}">
  <SmartForm title="${pageName}" />
</MainLayout>
`;
        await fetchJson('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo: repoName,
            path: astroPath,
            content: astroContent,
            message: `feat: create new contact page ${slug}`
          })
        });
        setCreateOpen(false);
        setRefreshTrigger(prev => prev + 1);
        route(`/editor/${encodeURIComponent(astroPath)}`);
        return;
      }

      // Default page creation logic for other design types
      const jsonPath = `content/pages${cleanSuffix}/_${slug}.json`;
      const astroPath = `src/pages${cleanSuffix}/_${slug}.astro`;

      const pageData = {
        slug,
        meta: { title: pageName },
        sections: [
          {
            id: `section-${Date.now()}`,
            type: 'hero',
            props: { title: pageName, subtitle: '', body: '' },
          },
        ],
      };

      const jsonContent = JSON.stringify(pageData, null, 2);
      await fetchJson('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoName,
          path: jsonPath,
          content: jsonContent,
          message: `feat: create new data file for ${slug}`
        }),
      });

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

      await fetchJson('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              repo: repoName,
              path: astroPath,
              content: astroContent,
              message: `feat: create new page ${slug}`
          })
      });

      setCreateOpen(false);
      setRefreshTrigger(prev => prev + 1);
      route(`/editor/${encodeURIComponent(astroPath)}`);

    } catch (err) {
      console.error('Create file error:', err);
      alert(`Failed to create file: ${err.message}`);
    }
  };

  const handleGoHome = () => {
    setCurrentPath('src/pages');
  };

  const handleGoBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(parentPath || 'src/pages');
  };

  return (
    <div className="h-full">
      <FileExplorer 
        repo={repoName}
        searchQuery={searchQuery} // Pass the searchQuery from the context
        currentPath={currentPath} // Pass currentPath from UIContext
        onPathChange={setCurrentPath}
        refreshTrigger={refreshTrigger}
      />

      <CreatePageModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <BottomActionBar
        showFileNav={true}
        currentPath={currentPath}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        onAdd={() => setCreateOpen(true)}
      />
    </div>
  );
}
