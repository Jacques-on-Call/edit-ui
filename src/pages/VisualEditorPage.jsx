import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';

    if (!filePath || !repo) {
      setError('File path and repository are required.');
      setIsLoading(false);
      return;
    }

    const fetchAndParseFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/get-file-content?repo=${repo}&path=${filePath}&ref=${branch}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch file content (status: ${response.status}).`);
        }

        const { content } = await response.json();
        const parsedBlueprint = parseAstroToBlueprint(content);

        if (!parsedBlueprint) {
          throw new Error('Failed to parse the Astro file. Check for valid markers.');
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

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Visual Editor (Blueprint Viewer)</h1>
          <p className="text-gray-600 mt-1">This is the shell for the new unified Astro editor. Below is the parsed blueprint of the file.</p>
        </header>

        {isLoading && (
          <div className="text-center text-gray-500">
            <p>Loading and parsing file...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
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
