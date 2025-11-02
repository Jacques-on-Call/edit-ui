// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { Zap, Check, TrendingUp } from 'lucide-preact';
import { route } from 'preact-router';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID_WAS_NOT_SET';
  const redirectUri = 'https://edit.strategycontent.agency/api/callback';
  const githubOauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${redirectUri}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    route('/repo-select', true);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-textPrimary px-4 sm:px-0">
      <div className="bg-surface p-10 sm:p-16 rounded-xl text-center max-w-md w-full">
        <img src="/logo.webp" alt="Easy SEO Logo" className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-5xl font-bold">Easy SEO</h1>
        <h2 className="text-4xl font-bold tracking-tight mt-4">Build a Google-ready site in minutes.</h2>
        <p className="text-textSecondary mt-6 text-lg">
            Fast. Simple. SEO-friendly.
        </p>

        <div className="my-12">&nbsp;</div> {/* Spacer */}

        <a
          href={githubOauthUrl}
          className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-primary rounded-lg hover:bg-opacity-90 transition-colors w-full max-w-md"
        >
          Sign Up Free Use
        </a>

        <div className="mt-8">
          <a href={githubOauthUrl} className="text-sm text-textSecondary hover:underline">
            Log In
          </a>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-16 text-center">
          <div className="flex flex-col items-center">
            <Zap size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Fast</span>
          </div>
          <div className="flex flex-col items-center">
            <Check size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Simple</span>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp size={28} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-textSecondary">Google-friendly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
