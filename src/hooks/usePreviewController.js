import { useState, useCallback, useRef } from 'react';
import { triggerPreviewBuild, pollLatestBuild } from '../utils/buildPreview';

const THROTTLE_MS = 45000; // 45 seconds

export function usePreviewController() {
  const [stale, setStale] = useState(true);
  const [building, setBuilding] = useState(false);
  const [builtAtISO, setBuiltAtISO] = useState(null);
  const [lastRunId, setLastRunId] = useState(null);
  const [error, setError] = useState(null);
  const lastTriggered = useRef(0);

  const triggerBuild = useCallback(async () => {
    const now = Date.now();
    if (now - lastTriggered.current < THROTTLE_MS) {
      console.log('Build trigger throttled.');
      return;
    }

    if (building) return;

    lastTriggered.current = now;
    setBuilding(true);
    setError(null);

    try {
      const context = await triggerPreviewBuild();
      // Start polling, passing the context which includes the trigger time
      const { runId, finishedAt } = await pollLatestBuild(context);
      setBuiltAtISO(finishedAt);
      setLastRunId(runId);
      setStale(false);
    } catch (err) {
      setError(err.message || 'The preview build failed. Please check the build logs.');
    } finally {
      setBuilding(false);
    }
  }, [building]);

  return {
    stale,
    setStale,
    building,
    builtAtISO,
    lastRunId,
    error,
    triggerBuild,
  };
}
