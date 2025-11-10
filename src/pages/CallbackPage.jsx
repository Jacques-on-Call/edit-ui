// easy-seo/src/pages/CallbackPage.jsx
import { useEffect } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';
import { LoginPage } from './LoginPage';

export function CallbackPage(props) {
  const { isAuthenticated, isLoading } = useAuth();
  const params = new URLSearchParams(location.search || '');
  const loginParam = params.get('login');

  useEffect(() => {
    // Wait for initial auth check to complete
    if (isLoading) return;

    // If user just logged in successfully and is now authenticated, redirect
    if (loginParam === 'success' && isAuthenticated) {
      console.log('[CallbackPage] Login successful, redirecting to repo-select');
      route('/repo-select', true);
      return;
    }

    // If already authenticated (returning user), redirect
    if (isAuthenticated && !loginParam) {
      console.log('[CallbackPage] Already authenticated, redirecting to repo-select');
      route('/repo-select', true);
      return;
    }

    // If auth failed after login redirect, show error
    if (loginParam === 'success' && !isAuthenticated && !isLoading) {
      console.error('[CallbackPage] Authentication failed after login redirect');
      route('/?error=auth_failed', true);
    }
  }, [isAuthenticated, isLoading, loginParam]);

  // Show loading spinner while auth check is in progress
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-lime"></div>
        <p className="ml-4 text-lg">Finalizing login...</p>
      </div>
    );
  }

  // If we get here, user is not authenticated and not in a login flow
  // Show the login page
  return <LoginPage {...props} />;
}
