// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-midnight-blue text-white p-6 font-sans">
      <div className="text-center w-full max-w-lg">
        <h1 className="text-8xl font-bold mb-4">ShowUp</h1>
        <h2 className="text-2xl text-light-grey mb-6">Build your business visibility, easily.</h2>
        <p className="text-light-grey mb-10">
          ShowUp helps professionals build high-ranking websites and attract new customers - fast.
        </p>

        <ul className="text-left text-light-grey space-y-4 mb-12 inline-block">
          <li className="flex items-center">
            <svg class="w-6 h-6 mr-2 text-yellow-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Personalized guidance
          </li>
          <li className="flex items-center">
            <svg class="w-6 h-6 mr-2 text-yellow-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Simple to update
          </li>
          <li className="flex items-center">
            <svg class="w-6 h-6 mr-2 text-yellow-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Easy SEO (search everywhere optimized)
          </li>
        </ul>

        <div className="mb-6">
          <a
            href={githubOauthUrl}
            className="inline-block px-16 py-4 text-xl font-bold bg-yellow-green text-midnight-blue rounded-lg transition-all duration-200 hover:scale-105"
            style={{ boxShadow: '-4px 4px 0px #D9D9D9' }}
          >
            Sign Up Free
          </a>
        </div>

        <div className="mb-10">
          <a href={githubOauthUrl} className="text-light-grey hover:underline">
            Login
          </a>
        </div>
      </div>

      <footer className="absolute bottom-6 text-sm text-light-grey opacity-75">
        Powered by Strategy Content Agency
      </footer>
    </div>
  );
}
