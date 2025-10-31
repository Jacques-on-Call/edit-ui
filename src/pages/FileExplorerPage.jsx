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
  const [error, setError] = useState(null);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  useEffect(() => {
    if (selectedRepo) {
      const fetchFiles = async () => {
        setIsFilesLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/files?repo=${selectedRepo.full_name}`, {
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

  return (
    <div className="pt-12">
      <h2 className={theme.typography.h2}>File Explorer: {selectedRepo.name}</h2>
      <p className="text-textSecondary mt-2">
        Browsing files in <span className="font-bold text-accent">{selectedRepo.full_name}</span>.
      </p>

      <div className="mt-8 bg-surface p-8 rounded-lg">
        {isFilesLoading ? (
          <p>Loading files...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : (
          <ul>
            {files.length > 0 ? (
              files.map((file) => (
                <li key={file.sha} className="py-2 border-b border-border">
                  {file.name}
                </li>
              ))
            ) : (
              <p>No files found in this repository.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
