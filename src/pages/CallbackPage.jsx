// easy-seo/src/pages/CallbackPage.jsx
import { useEffect, useState } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { route, useRouter } from 'preact-router';

export function CallbackPage() {
  const { checkAuthStatus, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [router] = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(router.url.split('?')[1] || '');
    if (params.get('login') === 'success') {
      // A login has just happened. Let's re-verify auth state.
      checkAuthStatus().then((isAuth) => {
        if (isAuth) {
          route('/repo-select', true);
        } else {
          // If auth fails even after a "successful" login, there's a problem.
          // Go to the login page with an error.
          route('/?error=auth_failed', true);
        }
      });
    } else if (isAuthenticated) {
      // If we land here and are already authenticated, go to the explorer.
      route('/repo-select', true);
    } else {
      // If no login happened and not authenticated, go home.
      route('/', true);
    }
  }, [checkAuthStatus, isAuthenticated, router.url]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-lime"></div>
      <p className="ml-4 text-lg">Finalizing login...</p>
    </div>
  );
}
