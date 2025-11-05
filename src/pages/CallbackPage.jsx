// easy-seo/src/pages/CallbackPage.jsx
import { useEffect } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';

export function CallbackPage() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // This effect will run whenever the loading or authentication state changes.
    // We wait until the initial authentication check is complete (!isLoading).
    if (!isLoading) {
      if (isAuthenticated) {
        // If authenticated, go to the repository selection page.
        route('/repo-select', true);
      } else {
        // If not authenticated, go back to the main login screen.
        route('/', true);
      }
    }
  }, [isLoading, isAuthenticated]); // Dependencies ensure this runs when state is updated

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-lime"></div>
      <p className="ml-4 text-lg">Finalizing login...</p>
    </div>
  );
}
