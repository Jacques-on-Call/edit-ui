// easy-seo/src/pages/SettingsPage.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';

export function SettingsPage() {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteOwner, setSiteOwner] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [secretsStatus, setSecretsStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // State for secrets
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfApiToken, setCfApiToken] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchJson('/api/settings');
        if (data) {
          setSiteTitle(data.siteTitle || '');
          setSiteDescription(data.siteDescription || '');
          setSiteOwner(data.siteOwner || '');
          setProfilePicUrl(data.profilePicUrl || '');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setStatusMessage('Failed to load settings.');
      }
    };

    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setStatusMessage('Saving...');
    try {
      await fetchJson('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle,
          siteDescription,
          siteOwner,
          profilePicUrl,
        }),
      });
      setStatusMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatusMessage('Failed to save settings.');
    } finally {
      setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
    }
  };

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        activeTab === tabName
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <TabButton tabName="general" label="General" />
        <TabButton tabName="integrations" label="Integrations & Secrets" />
      </div>

      {activeTab === 'general' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">General Site Config</h2>
          <p className="text-gray-400 mb-6 max-w-2xl">This information is public and will be used to identify your site. It is saved directly to the `site-config.json` file in your repository.</p>
          <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-400">Site Title</label>
              <input
                type="text"
                id="siteTitle"
                value={siteTitle}
                onInput={(e) => setSiteTitle(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-400">Site Description</label>
              <textarea
                id="siteDescription"
                rows="3"
                value={siteDescription}
                onInput={(e) => setSiteDescription(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
              ></textarea>
            </div>
            <div>
              <label htmlFor="siteOwner" className="block text-sm font-medium text-gray-400">Site Owner</label>
              <input
                type="text"
                id="siteOwner"
                value={siteOwner}
                onInput={(e) => setSiteOwner(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="profilePicUrl" className="block text-sm font-medium text-gray-400">Profile Picture URL</label>
              <input
                type="text"
                id="profilePicUrl"
                value={profilePicUrl}
                onInput={(e) => setProfilePicUrl(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
              />
            </div>
            <div>
              <button
                type="submit"
                className="px-6 py-2 bg-accent-lime text-black font-bold rounded-md hover:bg-lime-400 disabled:opacity-50 transition-colors"
                disabled={statusMessage === 'Saving...'}
              >
                {statusMessage === 'Saving...' ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
            {statusMessage && <p className="mt-4 text-sm text-gray-400">{statusMessage}</p>}
          </form>
        </div>
      )}

  const handleSaveSecrets = async (e) => {
    e.preventDefault();
    setSecretsStatus('Saving...');
    try {
      await fetchJson('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          repoName: selectedRepo.full_name.split('/')[1],
          cfAccountId,
          cfApiToken,
          resendApiKey,
        }),
      });
      setSecretsStatus('Secrets saved successfully!');
    } catch (error) {
      console.error('Failed to save secrets:', error);
      setSecretsStatus('Failed to save secrets.');
    } finally {
      setTimeout(() => setSecretsStatus(''), 3000);
    }
  };

  const handleTestConnection = async () => {
    setSecretsStatus('Testing connection...');
    try {
      const response = await fetchJson('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          cfApiToken,
        }),
      });
      setSecretsStatus(response.message || 'Connection successful!');
    } catch (error) {
      console.error('Connection test failed:', error);
      setSecretsStatus('Connection test failed.');
    } finally {
      setTimeout(() => setSecretsStatus(''), 3000);
    }
  };

      {activeTab === 'integrations' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Integrations & Secrets</h2>
          <p className="text-gray-400 mb-6 max-w-2xl">This is your Vault. The secrets you save here are sent directly to your Cloudflare project as environment variables. They are **never** saved to your GitHub repository.</p>

          <form onSubmit={handleSaveSecrets} className="space-y-8 max-w-xl">
            {/* Infrastructure Section */}
            <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-200">Infrastructure</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cfAccountId" className="block text-sm font-medium text-gray-400">Cloudflare Account ID</label>
                  <input
                    type="password"
                    id="cfAccountId"
                    value={cfAccountId}
                    onInput={(e) => setCfAccountId(e.target.value)}
                    className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="cfApiToken" className="block text-sm font-medium text-gray-400">Cloudflare API Token</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      id="cfApiToken"
                      value={cfApiToken}
                      onInput={(e) => setCfApiToken(e.target.value)}
                      className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
                    />
                    <button onClick={handleTestConnection} type="button" className="mt-1 px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors">Test</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Section */}
            <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-200">Communication</h3>
              <div>
                <label htmlFor="resendApiKey" className="block text-sm font-medium text-gray-400">Resend API Key</label>
                <input
                  type="password"
                  id="resendApiKey"
                  value={resendApiKey}
                  onInput={(e) => setResendApiKey(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-accent-lime focus:border-accent-lime sm:text-sm text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="px-6 py-2 bg-accent-lime text-black font-bold rounded-md hover:bg-lime-400 disabled:opacity-50 transition-colors"
                disabled={secretsStatus === 'Saving...'}
              >
                {secretsStatus === 'Saving...' ? 'Saving...' : 'Save Secrets'}
              </button>
            </div>
            {secretsStatus && <p className="mt-4 text-sm text-gray-400">{secretsStatus}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
