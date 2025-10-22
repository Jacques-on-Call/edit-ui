import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import PreviewPane from '../components/PreviewPane';
import { useSetting } from './SettingsPage';

// ... (hooks: useBuildStatus, useIdle)

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // ... (preview state)

  useEffect(() => {
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const repo = localStorage.getItem('selectedRepo');
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const isNew = searchParams.get('new') === '1';
    const templatePath = searchParams.get('template'); // For new files

    if (!filePath || !repo) {
      setError('File path and repository are required.');
      setIsLoading(false);
      return;
    }

    const fetchAndParseFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let fileContent;
        if (isNew && templatePath) {
          // For a new file, fetch the TEMPLATE content
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${templatePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) throw new Error(`API Error: Failed to fetch template file (status: ${response.status})`);
          const { content } = await response.json();
          // Substitute the title
          const pageTitle = filePath.split('/').pop().replace('.astro', '').replace(/-/g, ' ');
          fileContent = content.replace(/title\s*=\s*".*?"/, `title="${pageTitle}"`);
        } else {
          // For an existing file, fetch its actual content
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${filePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) {
             if (response.status === 404) {
                 throw new Error("File not found. It may not have been saved yet.");
             }
             throw new Error(`API Error: Failed to fetch file (status: ${response.status})`);
          }
          const { content } = await response.json();
          fileContent = content;
        }

        if (!fileContent) {
          throw new Error("File content is empty.");
        }

        const parsedBlueprint = parseAstroToBlueprint(fileContent);
        if (!parsedBlueprint) {
          throw new Error('Parsing Error: Failed to parse the Astro file. Check for valid markers or syntax errors.');
        }
        setBlueprint(parsedBlueprint);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParseFile();
  }, [location.search]);

  // ... (rest of the component, handlers, and JSX)
  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Visual Editor</h1>
          <p className="text-gray-600 mt-1">This is the shell for the new unified Astro editor. Below is the parsed blueprint of the file.</p>
        </header>

        {isLoading && <p>Loading...</p>}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <strong className="font-bold">An error occurred:</strong>
            <p className="block sm:inline ml-2">{error}</p>
          </div>
        )}

        {blueprint && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Parsed Blueprint</h2>
            <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(blueprint, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualEditorPage;
