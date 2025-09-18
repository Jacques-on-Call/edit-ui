import { useEffect, useState } from 'react';

export default function Callback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- vConsole DEBUG BLOCK ---
    // Initialize vConsole in the popup as well
    const initVConsole = async () => {
      // Only load if ?debug=true is in the popup's URL
      if (new URLSearchParams(window.location.search).has('debug')) {
        const { default: VConsole } = await import('vconsole');
        new VConsole();
        console.log('vConsole enabled in popup. Debugging token exchange...');

        // Log crucial info immediately
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        console.log("URL Code param:", code);
        console.log("URL State param:", state);
        console.log("Document Cookies:", document.cookie);
      }
    };
    initVConsole();
    // --- END DEBUG BLOCK ---

    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const savedState = document.cookie.match(/oauth_state=([^;]+)/)?.[1];

        document.cookie = 'oauth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';

        if (!code || !state || !savedState || state !== savedState) {
          console.error("State validation failed!", { state, savedState });
          throw new Error('Invalid state or code. Authentication failed.');
        }
        console.log("State validation successful.");

        console.log("Starting token exchange...");
        const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
          }),
        });

        console.log("Token exchange response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Token exchange failed. Full response:", response, "Body:", errorText);
          throw new Error(`Token exchange failed. Server said: ${errorText}`);
        }

        console.log("Token exchange successful!");
        window.opener.postMessage({ type: 'github-auth', success: true }, window.location.origin);
        window.close();

      } catch (err) {
        console.error('Full authentication error:', err);
        setError(err.message);
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
