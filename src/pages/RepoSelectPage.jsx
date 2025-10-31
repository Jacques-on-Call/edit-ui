// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';

export function RepoSelectPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <h2 className={theme.typography.h2}>Repository Selection</h2>
      {isLoading && <p>Loading...</p>}
      {!isLoading && !isAuthenticated && <p>You must be logged in to see your repositories.</p>}
      {!isLoading && isAuthenticated && (
        <p>Welcome, {user?.login}! Your repositories would be listed here.</p>
      )}
    </div>
  );
}
