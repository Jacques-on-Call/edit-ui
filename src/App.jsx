import { useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import './App.css';

// In a real app, these should be in a .env file
const GITHUB_CLIENT_ID = 'Ov23li6LEsxbtoV7ITp1';
const REDIRECT_URI = 'https://edit.strategycontent.agency/callback';

function App() {
  const [user, setUser] = useState(null);

  // Check for an existing session on component mount
  useEffect(() => {
    fetch('https://auth.strategycontent.agency/me', {
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
      }
    });
  }, []);

  const handleLogin = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    sessionStorage.setItem('pkce_code_verifier', verifier);

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'repo read:user');
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    window.open(
      authUrl.toString(),
      'github-login',
      'width=600,height=700'
    );
  };

  useEffect(() => {
    const handleMessage = (event) => {
      // Security: only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'github-auth') {
        if (event.data.success) {
          fetch('https://auth.strategycontent.agency/me', {
            credentials: 'include',
          })
            .then((res) => res.json())
            .then((userData) => setUser(userData));
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

  return (
    <div className="App">
      <header className="App-header">
        <img src="/vite.svg" className="App-logo" alt="logo" />
        {user ? (
          <div>
            <p>Welcome, {user.login}!</p>
            <p><img src={user.avatar_url} alt="avatar" width="50" height="50" /></p>
          </div>
        ) : (
          <div>
            <p>Please login to continue.</p>
            <button className="login-button" onClick={handleLogin}>
              Login with GitHub
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
