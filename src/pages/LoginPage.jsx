// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Github, Zap, RefreshCw, TrendingUp } from 'lucide-preact';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // IMPORTANT: The client ID is now sourced from an environment variable.
  // A .env.local file should be created with VITE_GITHUB_CLIENT_ID=...
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID_WAS_NOT_SET';
  const redirectUri = 'https://edit.strategycontent.agency/api/callback';
  const githubOauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${redirectUri}`;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-textPrimary">
      <div className="bg-surface p-12 rounded-xl text-center max-w-md w-full">
        <h2 className="text-3xl font-bold tracking-tight">Your Website, Made Simple & Fast.</h2>
        <p className="text-textSecondary mt-4 mb-10 max-w-xs mx-auto">
            Create a lightning-fast site that's simple to update and loved by search engines—no technical skills required.
        </p>

        <div className="grid grid-cols-3 gap-8 my-10 text-center">
          <div className="flex flex-col items-center">
            <Zap size={24} className="text-accent mb-2" />
            <span className="text-xs font-medium text-textSecondary">Lightning Fast</span>
          </div>
          <div className="flex flex-col items-center">
            <RefreshCw size={24} className="text-accent mb-2" />
            <span className="text-xs font-medium text-textSecondary">Simple to Update</span>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp size={24} className="text-accent mb-2" />
            <span className="text-xs font-medium text-textSecondary">Google Friendly</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[56px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="ml-3">Checking session...</p>
          </div>
        ) : isAuthenticated ? (
          <p className="text-success h-[56px] flex items-center justify-center">You are already logged in.</p>
        ) : (
          <a
            href={githubOauthUrl}
            className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-primary rounded-lg hover:bg-opacity-90 transition-colors w-full max-w-xs"
          >
            <Github size={20} className="mr-3" />
            Continue with GitHub
          </a>
        )}
      </div>
    </div>
  );
}
