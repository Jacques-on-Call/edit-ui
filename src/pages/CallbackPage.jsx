// easy-seo/src/pages/CallbackPage.jsx
import { useEffect } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';
import { LoginPage } from './LoginPage';

export function CallbackPage(props) {
  const { checkAuthStatus, isAuthenticated, isLoading } = useAuth();
  const params = new URLSearchParams(props.matches?.login ? `login=${props.matches.login}` : (location.search || ''));

  useEffect(() => {
    // Don't do anything while the initial auth check is running
    if (isLoading) return;

    if (params.get('login') === 'success') {
      // A login has just happened. Re-verify auth state.
      // This is crucial to pick up the new session.
      checkAuthStatus().then((isAuth) => {
        if (isAuth) {
          route('/repo-select', true);
        } else {
          // Auth failed even after a "successful" login.
          console.error("Authentication check failed after login redirect.");
          route('/?error=auth_failed', true);
        }
      });
    } else if (isAuthenticated) {
      // Already authenticated, send to repo selection.
      route('/repo-select', true);
    }
    // If none of the above, we'll just render the LoginPage below.

  }, [isAuthenticated, isLoading, props.path]);

  // While loading or redirecting, show a spinner.
  if (isLoading || isAuthenticated || params.get('login') === 'success') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-lime"></div>
        <p className="ml-4 text-lg">Finalizing login...</p>
      </div>
    );
  }

  // If not authenticated and not in a login flow, render the actual login page.
  return <LoginPage {...props} />;
}
