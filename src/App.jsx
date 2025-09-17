import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import RepoSelector from './RepoSelector';

// The Client ID is now read from the Vite environment variables
// See https://vitejs.dev/guide/env-and-mode.html
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = 'https://edit.strategycontent.agency/callback';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check for an existing session on component mount
  useEffect(() => {
    fetch('/api/me', {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      return null;
    })
    .then(userData => {
      if (userData && userData.login) {
        setUser(userData);
        const selectedRepo = localStorage.getItem('selectedRepo');
        if (selectedRepo) {
          navigate('/explorer');
        }
      }
    });
  }, [navigate]);

  const handleLogin = () => {
    // Generate a random state string for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    // Store the state in a temporary, secure cookie.
    // This is more reliable than sessionStorage across cross-origin redirects.
    // SameSite=None is required for the cookie to be sent in the cross-site
    // redirect from GitHub.
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax; Secure`;

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'repo read:user');
    authUrl.searchParams.set('state', state);

    // Open the popup window and redirect it to the GitHub auth URL.
    const popup = window.open(authUrl.toString(), 'github-login', 'width=600,height=700');
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      // Security: only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'github-auth') {
        if (event.data.success) {
          // The login was successful and the session cookie is now set.
          // Reload the main window. The useEffect hook at the top of the component
          // will then automatically fetch the user's data and update the UI.
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
  }, []);

  const handleRepoSelect = (repo) => {
    localStorage.setItem('selectedRepo', repo);
    navigate('/explorer');
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src="/logo.webp" className="App-logo" alt="logo" />
        {!user ? (
          <div>
            <p>Please login to continue.</p>
            <button className="login-button" onClick={handleLogin}>
              Login with GitHub
            </button>
          </div>
        ) : (
          <RepoSelector onRepoSelect={handleRepoSelect} />
        )}
      </header>
    </div>
  );
}

export default App;
