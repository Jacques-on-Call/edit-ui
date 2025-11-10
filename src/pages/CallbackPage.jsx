// easy-seo/src/pages/CallbackPage.jsx
import { useEffect, useRef } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';
import { LoginPage } from './LoginPage';

export function CallbackPage(props) {
  const { checkAuthStatus, isAuthenticated, isLoading } = useAuth();
  const params = new URLSearchParams(props.matches?.login ? `login=${props.matches.login}` : (location.search || ''));
  const callbackHandled = useRef(false); // NEW: Track if we've processed the callback

  useEffect(() => {
    if (isLoading) return;

    const loginParam = params.get('login');

    if (loginParam === 'success' && !callbackHandled.current) {
      callbackHandled.current = true; // Mark as handled immediately

      checkAuthStatus().then((isAuth) => {
        if (isAuth) {
          route('/repo-select', true);
        } else {
          console.error("Authentication check failed after login redirect.");
          route('/?error=auth_failed', true);
        }
      });
    } else if (isAuthenticated && !callbackHandled.current) {
      // Already authenticated, send to repo selection.
      route('/repo-select', true);
    }
  }, [isAuthenticated, isLoading]); // Original dependencies

  // While loading or redirecting, show a spinner.
  if (isLoading || (params.get('login') === 'success' && !callbackHandled.current)) {
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
