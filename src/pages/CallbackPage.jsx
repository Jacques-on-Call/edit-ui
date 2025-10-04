import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const savedState = document.cookie.match(/oauth_state=([^;]+)/)?.[1];

        // Clear the state cookie once it's been used
        document.cookie = 'oauth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';

        if (!code || !state || !savedState || state !== savedState) {
          throw new Error('Invalid state or code. Authentication failed. Please try again.');
        }

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token exchange failed. Server said: ${errorText}`);
        }

        // Notify the main window and close the popup
        window.opener.postMessage({ type: 'github-auth', success: true }, window.location.origin);
        window.close();

      } catch (err) {
        console.error('Full authentication error:', err);
        setError(err.message);
        // Notify the main window of the failure
        window.opener.postMessage({ type: 'github-auth', success: false, error: err.message }, window.location.origin);
      }
    };

    exchangeCodeForToken();
  }, []);

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">Processing login...</p>
    </div>
  );
}