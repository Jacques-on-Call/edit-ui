import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import PreviewPane from '../components/PreviewPane';
import { useSetting } from './SettingsPage';

function useBuildStatus(repo, isPolling, triggeredAt, onComplete) {
  const [pollInterval, setPollInterval] = useState(2000); // Start at 2s

  useEffect(() => {
    if (!isPolling) {
      setPollInterval(2000); // Reset on stop
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/build-status?repo=${repo}`, { credentials: 'include' });
        const data = await res.json();

        const relevantRun = data.workflow_runs?.find(run =>
          run.event === 'workflow_dispatch' && new Date(run.created_at) >= triggeredAt
        );

        if (relevantRun && relevantRun.status === 'completed') {
          onComplete(relevantRun.conclusion, relevantRun.id);
        } else {
          // Backoff strategy: 2s -> 4s -> 8s -> 10s (max)
          setPollInterval(prev => Math.min(prev * 2, 10000));
        }
      } catch (err) {
        console.error('Failed to poll build status:', err);
        onComplete('failure', null);
      }
    }, pollInterval);

    return () => clearTimeout(timer);
  }, [isPolling, repo, triggeredAt, onComplete, pollInterval]);
}

function useIdle(onIdle, idleTime) {
    const idleTimer = useRef(null);
    const resetTimer = useCallback(() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(onIdle, idleTime);
    }, [onIdle, idleTime]);

    useEffect(() => {
        const events = ['mousemove', 'keypress', 'mousedown', 'scroll'];
        events.forEach(event => document.addEventListener(event, resetTimer));
        resetTimer();
        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            if (idleTimer.current) clearTimeout(idleTimer.current);
        };
    }, [resetTimer]);
    return resetTimer;
}

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPreviewStale, setIsPreviewStale] = useState(false);
  const [lastBuilt, setLastBuilt] = useState(null);
  const [lastRunId, setLastRunId] = useState(null);
  const [buildTriggeredAt, setBuildTriggeredAt] = useState(null);
  const [isThrottled, setIsThrottled] = useState(false);

  const [autoRebuildEnabled] = useSetting('smart-auto-rebuild', false);
  const repo = localStorage.getItem('selectedRepo');
  const searchParams = new URLSearchParams(location.search);
  const filePath = searchParams.get('path');

  const handleBuildComplete = (conclusion, runId) => {
    setIsBuilding(false);
    if (conclusion === 'success') {
      setIsPreviewStale(false);
      setLastBuilt(new Date().toISOString());
      setLastRunId(runId);
    } else {
      setError('The preview build failed. Check GitHub Action logs.');
    }
  };

  useBuildStatus(repo, isBuilding, buildTriggeredAt, handleBuildComplete);

  const handleTriggerBuild = useCallback(async () => {
    if (!repo || isBuilding || isThrottled) return;

    setIsBuilding(true);
    setError(null);
    setBuildTriggeredAt(new Date());
    setIsThrottled(true);
    setTimeout(() => setIsThrottled(false), 30000); // 30s throttle

    try {
      const res = await fetch('/api/trigger-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo }),
      });
      if (!res.ok) throw new Error('Failed to trigger build.');
    } catch (err) {
      setError(err.message);
      setIsBuilding(false);
      setIsThrottled(false); // Reset throttle on error
    }
  }, [repo, isBuilding, isThrottled]);

  const resetIdleTimer = useIdle(() => {
      if (autoRebuildEnabled && isPreviewStale) {
          handleTriggerBuild();
      }
  }, 30000);

  useEffect(() => {
      const isNew = new URLSearchParams(location.search).get('new') === '1';
      if (autoRebuildEnabled && isNew) {
          handleTriggerBuild();
      }
  }, [autoRebuildEnabled, location.search, handleTriggerBuild]);

  const handleSave = () => {
    console.log("File saved (mock). Preview is now stale.");
    setIsPreviewStale(true);
    resetIdleTimer();
    if (autoRebuildEnabled && filePath.endsWith('.astro')) {
      handleTriggerBuild();
    }
  };

  useEffect(() => {
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
        const response = await fetch(`/api/get-file-content?repo=${repo}&path=${filePath}&ref=${branch}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Failed to fetch file (status: ${response.status})`);
        const { content } = await response.json();
        const parsedBlueprint = parseAstroToBlueprint(content);
        if (!parsedBlueprint) throw new Error('Failed to parse Astro file. Check for markers.');
        setBlueprint(parsedBlueprint);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParseFile();
  }, [location.search, repo, filePath]);

  const isRebuildDisabled = isBuilding || isThrottled;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Visual Editor</h1>
            <p className="text-sm text-gray-500 truncate">{filePath}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSave} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Save (Mock)</button>
            <button onClick={() => setIsPreviewing(true)} className="px-4 py-2 rounded-md bg-bark-blue text-white hover:bg-opacity-90">Preview</button>
          </div>
        </header>

        {isPreviewStale && !isBuilding && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 m-4 rounded-md">
             <div className="flex">
               <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5.9V6h2v6.1h-2zM9 14h2v-2H9v2z"/></svg></div>
               <div>
                 <p className="font-bold">Preview is out of date</p>
                 <p className="text-sm">Your recent changes haven't been rebuilt yet.</p>
               </div>
               <button onClick={handleTriggerBuild} disabled={isRebuildDisabled} className="ml-auto px-4 py-2 rounded-md bg-yellow-500 text-white self-center disabled:bg-yellow-300 disabled:cursor-not-allowed">Rebuild Preview</button>
             </div>
           </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8">
          {isLoading && <p className="text-center text-gray-500">Loading and parsing file...</p>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md"><p>{error}</p></div>}
          {blueprint && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Parsed Blueprint</h2>
              <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            </div>
          )}
        </main>
      </div>

      {isPreviewing && (
        <PreviewPane
          filePath={filePath}
          stale={isPreviewStale}
          building={isBuilding}
          builtAtISO={lastBuilt}
          lastRunId={lastRunId}
          onRebuild={handleTriggerBuild}
          onClose={() => setIsPreviewing(false)}
        />
      )}
    </div>
  );
}

export default VisualEditorPage;
