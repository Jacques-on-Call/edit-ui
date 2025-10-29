import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// The Client ID and Redirect URI are now read from Vite environment variables
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

function LoginPage() {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // This useEffect handles the OAuth callback.
  // It checks for a query parameter and closes the popup if it's present.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('close_popup') === 'true' && window.opener) {
      window.authDebug.auth('Login success message received in popup', { params: window.location.search });
      // Notify the opener window that login was successful, then close.
      window.opener.postMessage('login-success', window.location.origin);
      window.close();
    }
  }, []);

  // Check for an existing session on component mount, but only if the user hasn't initiated the login flow.
  useEffect(() => {
    if (isLoggingIn) return;
    window.authDebug.auth('Checking for existing session on LoginPage mount');
    fetch('/api/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        window.authDebug.warn('AUTH', 'No active session found during initial check.');
        return null;
      })
      .then(userData => {
        if (userData && userData.login) {
          window.authDebug.success('AUTH', 'Active session found, redirecting to repo selection', userData);
          navigate('/repository-selection');
        }
      });
  }, [navigate, isLoggingIn]);

  // This useEffect sets up a listener to hear from the OAuth popup.
  // When the popup sends a 'login-success' message, we navigate to the next page.
  useEffect(() => {
    const handleAuthMessage = (event) => {
      // Important: Check the origin of the message for security
      if (event.origin !== window.location.origin) {
        window.authDebug.warn('AUTH', 'Ignored message from incorrect origin', { origin: event.origin });
        return;
      }
      if (event.data === 'login-success') {
        window.authDebug.success('AUTH', 'Received login-success message from popup, navigating to repo selection');
        navigate('/repository-selection');
      }
    };
    window.authDebug.log('AUTH', 'Adding message listener for popup communication');
    window.addEventListener('message', handleAuthMessage);

    // Cleanup: remove the event listener when the component unmounts
    return () => {
      window.authDebug.log('AUTH', 'Removing message listener');
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [navigate]);

  const handleLogin = () => {
    window.authDebug.auth('Login button clicked, starting OAuth flow');
    setIsLoggingIn(true); // Prevent the session check from running while we're in the popup flow

    const state = Math.random().toString(36).substring(2, 15);
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax; Secure`;
    window.authDebug.storage('SET', 'oauth_state cookie', state);

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'repo read:user');
    authUrl.searchParams.set('state', state);

    const popup = window.open(authUrl.toString(), 'github-login', 'width=600,height=700');
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
      setIsLoggingIn(false); // Reset state if popup fails
    }
  };

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
