import { useState, useCallback, useRef, useEffect } from 'react';
import { triggerPreviewBuild, pollLatestBuild } from '../utils/buildPreview';

const THROTTLE_MS = 45000; // 45 seconds

export function usePreviewController() {
  const [stale, setStale] = useState(true);
  const [building, setBuilding] = useState(false);
  const [builtAtISO, setBuiltAtISO] = useState(null);
  const [lastRunId, setLastRunId] = useState(null);
  const [error, setError] = useState(null);
  const [rebuildCountdown, setRebuildCountdown] = useState(0);
  const lastTriggered = useRef(0);

  useEffect(() => {
    if (rebuildCountdown > 0) {
      const timer = setInterval(() => {
        setRebuildCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rebuildCountdown]);

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
    setRebuildCountdown(Math.floor(THROTTLE_MS / 1000));

    try {
      const context = await triggerPreviewBuild();
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
    rebuildDisabled: rebuildCountdown > 0,
    rebuildCountdown,
  };
}
