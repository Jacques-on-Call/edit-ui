// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github, Zap, RefreshCw, TrendingUp } from 'lucide-preact';
import { useRouter } from 'preact-router';
import { useEffect } from 'preact/compat';

export function LoginPage() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      // Manually trigger a re-check of the auth status.
      checkAuthStatus().then(() => {
        // After the check is complete, the isAuthenticated state will be updated.
        // The second useEffect will then handle the redirect.
      });
    }
  }, [checkAuthStatus]);

  useEffect(() => {
    // This effect runs whenever isAuthenticated changes.
    if (isAuthenticated && window.location.search.includes('login=success')) {
      window.location.href = '/repo-select';
    }
  }, [isAuthenticated]);

  // IMPORTANT: The client ID is now sourced from an environment variable.
  // A .env.local file should be created with VITE_GITHUB_CLIENT_ID=...
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID_WAS_NOT_SET';
  const redirectUri = 'https://edit.strategycontent.agency/api/callback';
  const githubOauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${redirectUri}`;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-textPrimary">
      <div className="bg-surface p-12 rounded-xl text-center max-w-md w-full">
        <h2 className="text-3xl font-bold tracking-tight">Your Website, Made Simple & Fast.</h2>
        <p className="text-textSecondary mt-6 text-lg">
            From blank page to search-engine-ready site in minutes—guided every step.
        </p>
        <p className="text-textSecondary mt-12 mb-16 max-w-md mx-auto">
            Create websites that impress visitors and climb search rankings—all in minutes.
        </p>

        <div className="grid grid-cols-3 gap-8 my-16 text-center">
          <div className="flex flex-col items-center">
            <Zap size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Lightning Fast</span>
          </div>
          <div className="flex flex-col items-center">
            <RefreshCw size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Simple to Update</span>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Google Friendly</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="ml-3">Checking session...</p>
          </div>
        ) : isAuthenticated ? (
          <p className="text-success h-[60px] flex items-center justify-center">You are already logged in.</p>
        ) : (
          <a
            href={githubOauthUrl}
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-primary rounded-lg hover:bg-opacity-90 transition-colors w-full max-w-sm"
          >
            <Github size={20} className="mr-3" />
            Continue with GitHub
          </a>
        )}
      </div>
    </div>
  );
}
