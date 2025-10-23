import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pathToPreviewRoute } from '../utils/previewRoute';

export default function PreviewPane({ filePath, stale, onRebuild, building, builtAtISO, lastRunId, sameOriginHint, onClose }) {
  const iframeRef = useRef(null);
  const [canNavigate, setCanNavigate] = useState(false);

  // Base route derived from file path
  const baseSrc = useMemo(() => pathToPreviewRoute(filePath), [filePath]);

  // Cache-bust key: prefer the run id; fallback to timestamp
  const cacheKey = lastRunId ? `build=${encodeURIComponent(lastRunId)}` : `t=${Date.now()}`;

  // Compose final src with cache-busting when building is done or when user reloads
  const src = useMemo(() => {
    const u = new URL(baseSrc, window.location.origin);
    // Only add cache-busting when not currently building (prevents thrash during polling)
    if (!building) {
      u.searchParams.set('v', cacheKey);
    }
    return u.toString();
  }, [baseSrc, building, cacheKey]);

  useEffect(() => {
    try {
      const previewOrigin = new URL(src, window.location.origin).origin;
      setCanNavigate(sameOriginHint ?? (previewOrigin === window.location.origin));
    } catch {
      setCanNavigate(false);
    }
  }, [src, sameOriginHint]);

  const reload = () => { iframeRef.current?.contentWindow?.location?.reload(); };
  const goBack = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.back(); };
  const goForward = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.forward(); };
  const openNewTab = () => window.open(src, '_blank', 'noopener,noreferrer');

  const lastBuiltText = builtAtISO
    ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
        .format(Math.round((new Date(builtAtISO).getTime() - Date.now()) / 60000), 'minute')
    : '';

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <header className="flex items-center gap-2 p-2 bg-white shadow">
        <span className="font-semibold">Preview</span>
        {building ? <span className="text-amber-600">Updating…</span> : (builtAtISO && <span className="text-gray-500">Last built {lastBuiltText}</span>)}
        {stale && !building && (
          <button className="ml-auto px-3 py-1 rounded bg-blue-600 text-white" onClick={onRebuild}>Rebuild preview</button>
        )}
        {!stale && <div className="ml-auto" />}
        <div className="flex items-center gap-2">
          {canNavigate ? (
            <>
              <button className="px-2 py-1 border rounded" onClick={goBack}>Back</button>
              <button className="px-2 py-1 border rounded" onClick={goForward}>Forward</button>
            </>
          ) : (
            <button className="px-2 py-1 border rounded" onClick={openNewTab}>Open in new tab</button>
          )}
          <button className="px-2 py-1 border rounded" onClick={reload}>Reload</button>
          <button className="px-2 py-1 border rounded" onClick={onClose}>Close</button>
        </div>
      </header>
      <iframe
        ref={iframeRef}
        src={src}
        title="Live Preview"
        className="flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
