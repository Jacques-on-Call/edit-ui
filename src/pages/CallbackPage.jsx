import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code || !state) {
          throw new Error('Invalid state or code. Authentication failed.');
        }

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token exchange failed: ${errorText}`);
        }

        // On success, update the state. This will trigger the next useEffect.
        setSuccess(true);

      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err.message);
      }
    };

    exchangeCodeForToken();
  }, []);

  // This effect will run when `success` becomes true, closing the window.
  useEffect(() => {
    if (success) {
      // A small delay gives the user feedback before the window vanishes.
      setTimeout(() => window.close(), 500);
    }
  }, [success]);

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Authentication Failed</h1>
          <p className="text-gray-700 mb-6">There was a problem authenticating your account. Please try again.</p>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 font-mono break-words">{error}</p>
          </div>
          <button
            onClick={() => window.close()}
            className="mt-8 bg-bark-blue text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bark-blue"
          >
            Close and Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-green-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-700">Success!</h1>
          <p className="text-gray-600">You are now authenticated. This window will close automatically.</p>
        </div>
      </div>
    );
  }

  return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Processing login, please wait...</p>
        </div>
      </div>
  );
}
