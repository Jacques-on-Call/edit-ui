import { useEffect, useState } from 'react';

export default function Callback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const verifier = sessionStorage.getItem('pkce_code_verifier');

        if (!code || !verifier) {
          throw new Error('Authorization code or verifier missing.');
        }

        // Clean up the verifier from session storage
        sessionStorage.removeItem('pkce_code_verifier');

        const response = await fetch('https://auth.strategycontent.agency/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            verifier,
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
