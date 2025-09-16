import { useEffect, useState } from 'react';

export default function Callback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const savedState = sessionStorage.getItem('oauth_state');

        // The state has now been "used", so we must remove it from storage
        // immediately to prevent it from being used again in a replay attack.
        sessionStorage.removeItem('oauth_state');

        // Now, we perform the validation using our in-memory variables.
        if (!code || !state || !savedState || state !== savedState) {
          throw new Error('Invalid state or code. Authentication failed.');
        }

        const response = await fetch('https://auth.strategycontent.agency/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Token exchange failed.' }));
          throw new Error(errorData.message || 'Token exchange failed.');
        }

        // Notify the main window that auth was successful
        window.opener.postMessage({ type: 'github-auth', success: true }, window.location.origin);
        window.close();

      } catch (err) {
        console.error('Authentication Error:', err);
        setError(err.message);
        // Also notify opener of failure
        window.opener.postMessage({ type: 'github-auth', success: false, error: err.message }, window.location.origin);
      }
    };

    exchangeCodeForToken();
  }, []);

  if (error) {
    return (
      <div>
        <h1>Authentication Failed</h1>
        <p>{error}</p>
        <button onClick={() => window.close()}>Close</button>
      </div>
    );
  }

  return <div>Processing login...</div>;
}
