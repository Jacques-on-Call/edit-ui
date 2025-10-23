import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import { compileAstro } from '../lib/layouts/compileAstro';
import { validateAstroLayout } from '../lib/layouts/validateAstro';
import VisualSidebar from '../components/VisualSidebar';
import PreviewPane from '../components/PreviewPane';
import { usePreviewController } from '../hooks/usePreviewController';
import { useAutosave } from '../hooks/useAutosave';
import { ensureUniqueAstroPath } from '../utils/uniquePath';

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [fileSha, setFileSha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const previewIframeRef = useRef(null);
  const {
    stale,
    setStale,
    building,
    builtAtISO,
    lastRunId,
    error: previewError,
    triggerBuild,
  } = usePreviewController();

  useAutosave(blueprint, setBlueprint);

  const handleSave = async () => {
    if (!blueprint) return;

    const content = compileAstro(blueprint);
    const { ok, errors } = validateAstroLayout(content);

    if (!ok) {
      setError(`Validation failed: ${errors.join(', ')}`);
      return;
    }

    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');

    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(content))),
          message: `feat: update ${filePath} from visual editor`,
          sha: fileSha,
        }),
      });
      if (!response.ok) throw new Error('Failed to save file.');
      const { sha } = await response.json();
      setFileSha(sha);
      setStale(true);

      const draftKey = `draft_${repo}_${filePath}`;
      localStorage.removeItem(draftKey);

      alert('File saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const applyLayoutToPage = async (layoutPath) => {
    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');

    try {
      // First, fetch the current page content
      const response = await fetch(`/api/file?repo=${repo}&path=${filePath}&ref=${branch}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch current page content.');
      const data = await response.json();
      const currentPageContent = atob(data.content);
      const currentPageSha = data.sha;

      // This is a simplified way to update frontmatter. A more robust solution
      // would use a proper parser, but for now, we'll use a regex.
      const newContent = currentPageContent.replace(/layout:\s*".*?"/, `layout: "${layoutPath}"`);

      // Now, save the updated page content
      const saveResponse = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(newContent))),
          message: `refactor: apply new layout ${layoutPath}`,
          sha: currentPageSha,
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to apply the new layout.');

      alert('New layout applied successfully!');
      setStale(true); // Mark the preview as stale
    } catch (err) {
      setError(`Failed to apply layout: ${err.message}`);
    }
  };

  const handleSaveAsLayout = async () => {
    if (!blueprint) return;

    const layoutName = prompt('Enter a name for your new layout:', 'my-custom-layout');
    if (!layoutName) return;

    const content = compileAstro(blueprint);
    const { ok, errors } = validateAstroLayout(content);

    if (!ok) {
      setError(`Validation failed: ${errors.join(', ')}`);
      return;
    }

    const repo = localStorage.getItem('selectedRepo');
    const desiredPath = `src/layouts/custom/${layoutName}.astro`;
    const uniquePath = await ensureUniqueAstroPath(repo, desiredPath);

    if (uniquePath !== desiredPath) {
      alert(`A layout with that name already exists. Saving as ${uniquePath.split('/').pop()} instead.`);
    }

    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: uniquePath,
          content: btoa(unescape(encodeURIComponent(content))),
          message: `feat: create custom layout ${uniquePath.split('/').pop()}`,
        }),
      });
      if (!response.ok) throw new Error('Failed to save layout.');

      alert('Layout saved successfully!');

      if (window.confirm('Would you like to apply this new layout to the current page?')) {
        await applyLayoutToPage(uniquePath);
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
        let fileContent, sha;
        if (isNew && templatePath) {
          // For a new file, fetch the TEMPLATE content
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${templatePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) throw new Error(`API Error: Failed to fetch template file (status: ${response.status})`);
          const { content } = await response.json();
          // Substitute the title
          const pageTitle = filePath.split('/').pop().replace('.astro', '').replace(/-/g, ' ');
          fileContent = content.replace(/title\s*=\s*".*?"/, `title="${pageTitle}"`);
          sha = null; // New files don't have a sha
        } else {
          // For an existing file, fetch its actual content and sha
          const response = await fetch(`/api/file?repo=${repo}&path=${filePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) {
             if (response.status === 404) {
                 throw new Error("File not found. It may not have been saved yet.");
             }
             throw new Error(`API Error: Failed to fetch file (status: ${response.status})`);
          }
          const data = await response.json();
          fileContent = atob(data.content);
          sha = data.sha;
        }

        if (!fileContent) {
          throw new Error("File content is empty.");
        }

        const parsedBlueprint = parseAstroToBlueprint(fileContent);
        if (!parsedBlueprint) {
          throw new Error('Parsing Error: Failed to parse the Astro file. Check for valid markers or syntax errors.');
        }
        setBlueprint(parsedBlueprint);
        setFileSha(sha);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParseFile();
  }, [location.search]);

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <div className="flex-grow p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Editor</h1>
            {builtAtISO && <p className="text-gray-500 text-sm">Last built {new Date(builtAtISO).toLocaleTimeString()}</p>}
          </div>
          <div className="flex items-center gap-2">
            {stale && !building && (
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={triggerBuild}>Rebuild Preview</button>
            )}
            {building && <span className="text-amber-600">Building preview…</span>}
          </div>
        </header>

        {isLoading && <p>Loading...</p>}

        {(error || previewError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <strong className="font-bold">An error occurred:</strong>
            <p className="block sm:inline ml-2">{error || previewError}</p>
          </div>
        )}

        {stale && !building && (
          <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2 mb-4">
            Preview is out of date. Click “Rebuild Preview” to update.
          </div>
        )}

        {blueprint && (
          <PreviewPane ref={previewIframeRef} filePath={new URLSearchParams(location.search).get('path')} cacheKey={lastRunId || ''} />
        )}
      </div>
      <VisualSidebar
        blueprint={blueprint}
        setBlueprint={setBlueprint}
        onSave={handleSave}
        onSaveAsLayout={handleSaveAsLayout}
        previewIframe={previewIframeRef.current}
      />
    </div>
  );
}

export default VisualEditorPage;
