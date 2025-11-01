// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { AlertTriangle } from 'lucide-preact';
import { useState, useEffect } from 'preact/compat';

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

  const { selectedRepo } = useAuth();
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [error, setError] = useState(null);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  useEffect(() => {
    if (selectedRepo) {
      const fetchFiles = async () => {
        setIsFilesLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/files?repo=${selectedRepo.full_name}&path=${path}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const filesData = await response.json();
            setFiles(filesData);
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to fetch files.');
          }
        } catch (err) {
          setError('An unexpected error occurred.');
        } finally {
          setIsFilesLoading(false);
        }
      };
      fetchFiles();
    }
  }, [selectedRepo]);

  if (!selectedRepo) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h2 className={theme.typography.h2}>No Repository Selected</h2>
        <p className="text-textSecondary mt-2">Please go back and select a repository to view its files.</p>
      </div>
    );
  }

  const handleGoHome = () => setPath('src/pages');
  const isAtRoot = path === 'src/pages';

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
        {isFilesLoading ? (
          <p>Loading files...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : (
          files.length > 0 ? (
            files.map((file) => (
              <div key={file.sha} className="p-4 bg-surface rounded-lg text-center">
                <p>{file.name}</p>
              </div>
            ))
          ) : (
            <p>No files found in this directory.</p>
          )
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border flex justify-between items-center p-2 z-10">
        <div className="flex-1 flex justify-start">
        </div>
        <div className="flex-1 flex justify-center">
        </div>
        <div className="flex-1 flex justify-end">
            <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGoHome}
                disabled={isAtRoot}
            >
                <span>Home</span>
            </button>
        </div>
      </div>
    </div>
  );
}
