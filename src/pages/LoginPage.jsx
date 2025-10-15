import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// The Client ID and Redirect URI are now read from Vite environment variables
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

function LoginPage() {
  // Force cache bust with a new comment at 2025-10-15 12:18
  const navigate = useNavigate();

  // Check for an existing session on component mount
  useEffect(() => {
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
    // Use SameSite=Lax for the state cookie as it's a first-party context.
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax; Secure`;

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'repo read:user');
    authUrl.searchParams.set('state', state);

    const popup = window.open(authUrl.toString(), 'github-login', 'width=600,height=700');
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }

    // Polling mechanism to check if the popup is closed
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        // After popup is closed, check authentication status
        fetch('/api/me', { credentials: 'include' })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Not authenticated');
          })
          .then(userData => {
            if (userData && userData.login) {
              navigate('/repository-selection');
            }
          })
          .catch(err => {
            console.log("Authentication check failed after popup close:", err.message);
            // Optional: Show a message to the user that login was not completed.
          });
      }
    }, 500);
  };

  // Removed the useEffect for message handling as it's replaced by the polling mechanism.

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
        <div className="mt-8 text-xs text-gray-400">
          <p>DEBUG: Redirect URI</p>
          <p className="font-mono bg-gray-700 p-2 rounded">{REDIRECT_URI}</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;