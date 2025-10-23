import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import PreviewPane from '../components/PreviewPane';
import { compileAstro } from '../lib/layouts/compileAstro';

function useBuildStatus(repo, onComplete) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [builtAt, setBuiltAt] = useState(null);
  const [lastRunId, setLastRunId] = useState(null);
  const [error, setBuildError] = useState(null);
  const pollTimeout = useRef(null);

  const poll = useCallback(async (triggeredAt) => {
    try {
      const res = await fetch(`/api/build-status?repo=${repo}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not fetch build status.');
      const { status, conclusion, run_id, completed_at } = await res.json();

      if (status === 'completed') {
        setIsBuilding(false);
        setBuiltAt(completed_at);
        setLastRunId(run_id);
        if (conclusion === 'success') {
          onComplete?.(run_id);
        } else {
          setBuildError(`Build failed with conclusion: ${conclusion}`);
        }
      } else {
        pollTimeout.current = setTimeout(() => poll(triggeredAt), 2000); // Poll every 2s
      }
    } catch (err) {
      setIsBuilding(false);
      setBuildError(err.message);
    }
  }, [repo, onComplete]);

  const triggerBuild = useCallback(async () => {
    setIsBuilding(true);
    setBuildError(null);
    clearTimeout(pollTimeout.current);
    const triggeredAt = new Date().toISOString();
    try {
      const res = await fetch('/api/trigger-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo }),
      });
      if (!res.ok) throw new Error('Failed to trigger build.');
      // Start polling
      poll(triggeredAt);
    } catch (err) {
      setIsBuilding(false);
      setBuildError(err.message);
    }
  }, [repo, poll]);

  useEffect(() => () => clearTimeout(pollTimeout.current), []);

  return { isBuilding, builtAt, lastRunId, triggerBuild, error };
}


function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnmarked, setIsUnmarked] = useState(false);
  const location = useLocation();
  const [repo, setRepo] = useState(localStorage.getItem('selectedRepo'));
  const [filePath, setFilePath] = useState(null);

  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [isStale, setStale] = useState(false);

  const { isBuilding, builtAt, lastRunId, triggerBuild, error: buildError } = useBuildStatus(repo, () => {
    setStale(false);
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setFilePath(searchParams.get('path'));
  }, [location.search]);

  const handleSave = async () => {
    if (!blueprint || !filePath || !repo) return;
    try {
      const content = compileAstro(blueprint);
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(content))),
          message: `feat: update ${filePath} from visual editor`,
        }),
      });
      if (!response.ok) throw new Error('Failed to save file.');
      setStale(true);
    } catch (err) {
      setError(err.message);
    }
  };


  useEffect(() => {
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const searchParams = new URLSearchParams(location.search);
    const path = searchParams.get('path');
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
      setIsUnmarked(false);
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
          // This is not an error, but a state the user needs to see.
          setIsUnmarked(true);
          setBlueprint(null);
        } else {
          setBlueprint(parsedBlueprint);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParseFile();
  }, [location.search]);

  // ... (rest of the component, handlers, and JSX)

  if (!repo) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Repository Context Missing</h1>
          <p className="text-gray-600 mb-6">This editor requires a selected repository to function. Please select a repository to continue.</p>
          <Link
            to="/repository-selection"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Select a Repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {isPreviewVisible && (
        <PreviewPane
          filePath={filePath}
          stale={isStale}
          onRebuild={triggerBuild}
          building={isBuilding}
          builtAtISO={builtAt}
          lastRunId={lastRunId}
          onClose={() => setPreviewVisible(false)}
        />
      )}
      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Visual Editor</h1>
              <p className="text-gray-600 mt-1">{filePath}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setPreviewVisible(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Preview
              </button>
            </div>
          </header>

          {isStale && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Preview is out-of-date</p>
                <p>You've saved changes. Rebuild the preview to see the latest version.</p>
             </div>
          )}

          {buildError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
                <strong className="font-bold">Build Error:</strong>
                <p className="block sm:inline ml-2">{buildError}</p>
              </div>
          )}


          {isLoading && <p>Loading file...</p>}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
              <strong className="font-bold">An error occurred:</strong>
              <p className="block sm:inline ml-2">{error}</p>
            </div>
          )}

          {isUnmarked && !isLoading && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-md text-center">
              <h2 className="text-xl font-bold mb-2">File Not Ready for Visual Editing</h2>
              <p className="mb-4">This Astro file doesn’t contain the required editor markers. To use the visual editor, markers need to be added to define editable regions.</p>
              <button
                onClick={() => alert('Marker injection functionality coming soon!')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
              >
                Add Markers
              </button>
            </div>
          )}

          {blueprint && !isUnmarked && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Editor UI goes here</h2>
              {/* This is where the visual editor controls will be added in a future step. */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default VisualEditorPage;
