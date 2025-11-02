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
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#191970' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#D8F21D' }}></div>
        <p className="ml-3" style={{ color: '#D9D9D9' }}>Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    route('/repo-select', true);
    return null;
  }

  return (
    <div className="flex min-h-screen font-sans" style={{ backgroundColor: '#191970', color: 'white' }}>
      <div className="w-full flex justify-center">
        <div className="pt-20" style={{ marginLeft: '20%', maxWidth: '500px', width: '100%' }}>

          <header className="flex items-center gap-5 mb-10">
            <img src="/ShowUp-Logo.webp" alt="ShowUp Logo" className="h-14 w-14" />
            <h1 className="text-6xl font-bold">ShowUp</h1>
          </header>

          <main>
            <h2 className="text-3xl font-medium mb-4" style={{ color: '#D8F21D' }}>Build your business visibility, easily.</h2>
            <p className="text-lg mb-12" style={{ color: '#D9D9D9' }}>
              ShowUp helps professionals build high-ranking websites and attract new customers - fast.
            </p>

            <ul className="space-y-5 mb-16 text-lg">
              <li className="flex items-center gap-4">
                <Zap size={24} style={{ color: '#D8F21D' }} />
                <span>Personalized guidance</span>
              </li>
              <li className="flex items-center gap-4">
                <Check size={24} style={{ color: '#D8F21D' }} />
                <span>Simple to update</span>
              </li>
              <li className="flex items-center gap-4">
                <TrendingUp size={24} style={{ color: '#D8F21D' }} />
                <span>Easy SEO (search everywhere optimized)</span>
              </li>
            </ul>

            <div className="mb-8">
              <a
                href={githubOauthUrl}
                className="inline-flex items-center gap-3 px-6 py-3 text-xl font-bold rounded-md transition-shadow hover:shadow-2xl"
                style={{ backgroundColor: '#000', color: 'white', boxShadow: '-4px 4px 0px 0px #A0A0A0' }}
              >
                <ArrowUpRight size={24} style={{ color: '#D8F21D' }} />
                Sign Up Free
              </a>
            </div>

            <div>
              <a href={githubOauthUrl} className="text-lg font-semibold underline" style={{ color: 'white' }}>
                Login
              </a>
            </div>
          </main>

        </div>
      </div>
      <footer className="absolute bottom-6 text-sm" style={{ color: '#D9D9D9', left: 'calc(20% + 1rem)' }}>
        Powered by Strategy Content Agency
      </footer>
    </div>
  );
}
