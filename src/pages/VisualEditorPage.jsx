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
      {/* ... same as before ... */}
    </div>
  );
}

export default VisualEditorPage;
