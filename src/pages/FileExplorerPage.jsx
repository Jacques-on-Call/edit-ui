// easy-seo/src/pages/FileExplorerPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';

export function FileExplorerPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <h2 className={theme.typography.h2}>File Explorer</h2>
      {isLoading && <p>Loading...</p>}
      {!isLoading && !isAuthenticated && <p>You must be logged in to view files.</p>}
      {!isLoading && isAuthenticated && (
        <p>File explorer for the selected repository would be here.</p>
      )}
    </div>
  );
}
