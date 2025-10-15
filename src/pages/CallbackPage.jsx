import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        // Note: The cookie is HttpOnly and cannot be accessed by document.cookie on the client.
        // The state is validated on the server side now.

        if (!code || !state) {
          throw new Error('Invalid state or code. Authentication failed.');
        }

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }), // Pass state to server for validation
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token exchange failed: ${errorText}`);
        }

        // The main window's poller will detect the successful login.
        // We just need to close the popup.
        window.close();

      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err.message);
        // Do not close the window if there's an error, so the user can see it.
      }
    };

    exchangeCodeForToken();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>Authentication Failed</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>You can close this window and try again.</p>
        <button onClick={() => window.close()} style={{ marginTop: '20px' }}>Close</button>
      </div>
    );
  }

  return <div>Processing login, please wait...</div>;
}