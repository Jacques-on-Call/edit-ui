import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { triggerPreviewBuild, pollLatestBuild } from '../utils/buildPreview';
import PreviewPane from '../components/PreviewPane';

export default function VisualEditorPage() {
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const filePath = qs.get('path') || '';
  const repo = localStorage.getItem('selectedRepo');
  const branch = localStorage.getItem('selectedBranch') || 'main';

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [fileName, setFileName] = useState('');
  const [stale, setStale] = useState(true);
  const [building, setBuilding] = useState(false);
  const [builtAt, setBuiltAt] = useState(null);
  const [cacheKey, setCacheKey] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!repo || !filePath) {
        setLoadErr('Missing repository or file path. Please select a repository again.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoadErr('');
        const res = await fetch(`/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(branch)}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load file (${res.status}). ${await res.text()}`);
        setFileName(filePath.split('/').pop() || filePath);
        setStale(true);
      } catch (e) {
        setLoadErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [repo, branch, filePath]);

  const rebuild = async () => {
    if (building) return;
    setBuilding(true);
    try {
      const ctx = await triggerPreviewBuild();
      const { runId, finishedAt } = await pollLatestBuild(ctx);
      setBuiltAt(finishedAt);
      setCacheKey(runId || Date.now());
      setStale(false);
    } catch (e) {
      setLoadErr(e.message || 'Preview build failed.');
    } finally {
      setBuilding(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading editor…</div>;

  if (loadErr) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-white border rounded-lg">
        <h1 className="text-lg font-semibold mb-2">Can’t open Visual Editor</h1>
        <p className="text-gray-700 mb-4">{loadErr}</p>
        <div className="flex gap-2">
          <Link className="px-3 py-2 rounded bg-gray-200" to="/repository-selection">Select Repository</Link>
          <Link className="px-3 py-2 rounded bg-gray-200" to="/explorer">Back to Explorer</Link>
        </div>
      </div>
    );
  }

  const lastBuiltText = builtAt
    ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
        .format(Math.round((new Date(builtAt).getTime() - Date.now()) / 60000), 'minute')
    : null;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fileName || 'Visual Editor'}</h1>
            {lastBuiltText && <p className="text-gray-500 text-sm">Last built {lastBuiltText}</p>}
          </div>
          <div className="flex items-center gap-2">
            {stale && !building && (
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={rebuild}>Rebuild Preview</button>
            )}
            {building && <span className="text-amber-600">Building preview…</span>}
          </div>
        </header>

        {stale && !building && (
          <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2">
            Preview is out of date. Click “Rebuild Preview” to update.
          </div>
        )}

        <PreviewPane filePath={filePath} cacheKey={cacheKey} />
      </div>
    </div>
  );
}
