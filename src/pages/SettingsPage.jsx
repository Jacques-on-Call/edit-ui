// easy-seo/src/pages/SettingsPage.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';

export function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteOwner, setSiteOwner] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  const handleSave = async (e) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">General Settings</h1>
      <form onSubmit={handleSave} className="space-y-4 max-w-xl">
        <div>
          <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-400">Site Title</label>
          <input
            type="text"
            id="siteTitle"
            value={siteTitle}
            onInput={(e) => setSiteTitle(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-400">Site Description</label>
          <textarea
            id="siteDescription"
            rows="3"
            value={siteDescription}
            onInput={(e) => setSiteDescription(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
          ></textarea>
        </div>
        <div>
          <label htmlFor="siteOwner" className="block text-sm font-medium text-gray-400">Site Owner</label>
          <input
            type="text"
            id="siteOwner"
            value={siteOwner}
            onInput={(e) => setSiteOwner(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="profilePicUrl" className="block text-sm font-medium text-gray-400">Profile Picture URL</label>
          <input
            type="text"
            id="profilePicUrl"
            value={profilePicUrl}
            onInput={(e) => setProfilePicUrl(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-black rounded-md hover:bg-accent-dark disabled:opacity-50"
            disabled={statusMessage === 'Saving...'}
          >
            {statusMessage === 'Saving...' ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        {statusMessage && <p className="mt-4 text-sm text-gray-400">{statusMessage}</p>}
      </form>
    </div>
  );
}
