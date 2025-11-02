// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';
import { Zap, Check, TrendingUp, ArrowUpRight } from 'lucide-preact';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_CLIENT_ID_WAS_NOT_SET';
  const redirectUri = 'https://edit.strategycontent.agency/api/callback';
  const githubOauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${redirectUri}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-midnight-blue">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-green"></div>
        <p className="ml-3 text-light-grey">Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    route('/repo-select', true);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-midnight-blue text-white p-8 font-sans">
      <div className="w-full max-w-sm">

        <header className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold">ShowUp</h1>
          <div className="bg-yellow-green rounded-full p-2">
            <ArrowUpRight className="text-midnight-blue" size={28} />
          </div>
        </header>

        <main>
          <h2 className="text-xl font-bold text-yellow-green mb-3">Build your business visibility, easily.</h2>
          <p className="text-light-grey mb-8">
            ShowUp helps professionals build high-ranking websites and attract new customers - fast.
          </p>

          <ul className="space-y-4 mb-10">
            <li className="flex items-center">
              <Zap size={20} className="text-white mr-3" />
              <span className="text-light-grey">Personalized guidance</span>
            </li>
            <li className="flex items-center">
              <Check size={20} className="text-white mr-3" />
              <span className="text-light-grey">Simple to update</span>
            </li>
            <li className="flex items-center">
              <TrendingUp size={20} className="text-white mr-3" />
              <span className="text-light-grey">Easy SEO (search everywhere optimized)</span>
            </li>
          </ul>

          <div className="mb-6">
            <a
              href={githubOauthUrl}
              className="flex items-center justify-center w-full px-6 py-3 text-lg font-bold bg-surface text-white rounded-md border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              <ArrowUpRight size={22} className="mr-2" />
              Sign Up Free
            </a>
          </div>

          <div>
            <a href={githubOauthUrl} className="font-bold text-yellow-green hover:underline">
              Login
            </a>
          </div>
        </main>

      </div>

      <footer className="absolute bottom-6 text-sm text-light-grey opacity-75">
        Powered by Strategy Content Agency
      </footer>
    </div>
  );
}
