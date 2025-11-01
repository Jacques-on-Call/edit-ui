// easy-seo/src/pages/CallbackPage.jsx
import { useEffect } from 'preact/compat';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'preact-router';

export function CallbackPage() {
  const { checkAuthStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      await checkAuthStatus();
      router.route('/repo-select', true);
    };
    handleCallback();
  }, [checkAuthStatus, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
      <p className="ml-4 text-lg">Finalizing login...</p>
    </div>
  );
}
