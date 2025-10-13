import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// The Client ID and Redirect URI are now read from Vite environment variables
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

function LoginPage() {
  // Trivial change to force a new build hash and bypass CDN cache.
  const navigate = useNavigate();

  // Check for an existing session on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      // If we've just logged in, reload the page without the query param
      // to ensure a clean state before proceeding.
      window.history.replaceState({}, document.title, "/");
      window.location.reload();
      return;
    }

    fetch('/api/me', {
      credentials: 'include',
    })
    .then(res => res.ok ? res.json() : null)
    .then(userData => {
      if (userData && userData.login) {
        // If user is already logged in, redirect to the repository selection page
        navigate('/repository-selection');
      }
    });
  }, [navigate]);

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2, 15);
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=None; Secure`;

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'repo read:user');
    authUrl.searchParams.set('state', state);

    const popup = window.open(authUrl.toString(), 'github-login', 'width=600,height=700');
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data.type === 'github-auth') {
        if (event.data.success) {
          // On successful auth, reload the page.
          // The useEffect hook at the top will then redirect to the repo selection page.
          window.location.reload();
        } else if (event.data.error) {
          console.error("Login failed:", event.data.error);
          alert("GitHub login failed: " + event.data.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div className="bg-bark-blue min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full p-8">
        <img src="/logo.webp" className="h-24 w-auto mx-auto mb-8" alt="logo" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Easy SEO</h1>
          <p className="text-gray-300 mb-8">Please login with GitHub to continue.</p>
          <button
            onClick={handleLogin}
            className="bg-white text-bark-blue font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 ease-in-out"
          >
            Login with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;