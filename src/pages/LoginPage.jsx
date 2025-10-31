// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github } from 'lucide-preact';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // IMPORTANT: The client ID is now sourced from an environment variable.
  // A .env.local file should be created with VITE_GITHUB_CLIENT_ID=...
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID_WAS_NOT_SET';
  const redirectUri = 'https://edit.strategycontent.agency/api/callback';
  const githubOauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${redirectUri}`;

  return (
    <div className="flex flex-col items-center justify-center h-full pt-24">
      <div className="bg-surface p-8 rounded-lg shadow-lg text-center max-w-sm">
        <h2 className={theme.typography.h2}>Welcome to Easy-SEO</h2>
        <p className="text-textSecondary mt-2 mb-6">
          The headless CMS for your Astro site, powered by GitHub.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="ml-3">Checking session...</p>
          </div>
        ) : isAuthenticated ? (
          <p className="text-success">You are already logged in.</p>
        ) : (
          <a
            href={githubOauthUrl}
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-opacity-80 transition-colors"
          >
            <Github size={20} className="mr-2" />
            Login with GitHub
          </a>
        )}
      </div>
    </div>
  );
}
