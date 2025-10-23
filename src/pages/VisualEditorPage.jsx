import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import { compileAstro } from '../lib/layouts/compileAstro';
import { validateAstroLayout } from '../lib/layouts/validateAstro';
import VisualSidebar from '../components/VisualSidebar';
import PreviewPane from '../components/PreviewPane';
import MobileQuickBar from '../components/MobileQuickBar';
import { usePreviewController } from '../hooks/usePreviewController';
import { useAutosave } from '../hooks/useAutosave';
import { ensureUniqueAstroPath } from '../utils/uniquePath';

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [fileSha, setFileSha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDesignPanelOpen, setIsDesignPanelOpen] = useState(false);
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
    rebuildDisabled,
    rebuildCountdown,
  } = usePreviewController();

  useAutosave(blueprint, setBlueprint, fileSha);

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

      const draftKey = `draft_${repo}_${filePath}_${sha}`;
      localStorage.removeItem(draftKey);

      alert('File saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const applyLayoutToPage = async (layoutPath) => {
    // ... same as before
  };

  const handleSaveAsLayout = async () => {
    // ... same as before
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
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${templatePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) throw new Error(`API Error: Failed to fetch template file (status: ${response.status})`);
          const { content } = await response.json();
          const pageTitle = filePath.split('/').pop().replace('.astro', '').replace(/-/g, ' ');
          fileContent = content.replace(/title\s*=\s*".*?"/, `title="${pageTitle}"`);
          sha = null;
        } else {
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
      <div className="hidden lg:block">
        <VisualSidebar
          blueprint={blueprint}
          setBlueprint={setBlueprint}
          onSave={handleSave}
          onSaveAsLayout={handleSaveAsLayout}
          previewIframe={previewIframeRef.current}
        />
      </div>
      <div className="lg:hidden">
        <MobileQuickBar
          onSave={handleSave}
          onRebuild={triggerBuild}
          rebuildDisabled={rebuildDisabled}
          rebuildCountdown={rebuildCountdown}
          onAddBlock={() => alert('Add block clicked')}
          onOpenDesign={() => setIsDesignPanelOpen(true)}
        />
        {isDesignPanelOpen && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsDesignPanelOpen(false)}>
            <div className="fixed bottom-0 inset-x-0 bg-white p-4 rounded-t-lg" onClick={(e) => e.stopPropagation()}>
              <VisualSidebar
                blueprint={blueprint}
                setBlueprint={setBlueprint}
                onSave={handleSave}
                onSaveAsLayout={handleSaveAsLayout}
                previewIframe={previewIframeRef.current}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualEditorPage;
