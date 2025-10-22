import React from 'react';

// A simple mock settings store. In a real app, this would be backed by localStorage.
const settings = {
  'smart-auto-rebuild': false,
};

export const useSetting = (key, defaultValue) => {
  const [value, setValue] = React.useState(settings[key] ?? defaultValue);

  const setSetting = (newValue) => {
    settings[key] = newValue;
    setValue(newValue);
  };

  return [value, setSetting];
};


function SettingsPage() {
  const [autoRebuild, setAutoRebuild] = useSetting('smart-auto-rebuild', false);

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Preview Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="auto-rebuild-toggle" className="font-medium text-gray-900">
                Enable Smart Auto-Rebuild
              </label>
              <p className="text-sm text-gray-500">
                Automatically rebuild the preview on page creation, layout saves, or after a period of inactivity.
              </p>
            </div>
            <label htmlFor="auto-rebuild-toggle" className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  id="auto-rebuild-toggle"
                  className="sr-only"
                  checked={autoRebuild}
                  onChange={(e) => setAutoRebuild(e.target.checked)}
                />
                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoRebuild ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
