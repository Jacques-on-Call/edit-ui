import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { pathToPreviewRoute } from '../utils/previewRoute';

const PreviewPane = forwardRef(function PreviewPane({ filePath, cacheKey }, ref) {
  const [sameOrigin, setSameOrigin] = useState(false);

  const baseSrc = useMemo(() => pathToPreviewRoute(filePath), [filePath]);

  const src = useMemo(() => {
    const u = new URL(baseSrc, window.location.origin);
    if (cacheKey) u.searchParams.set('v', String(cacheKey));
    return u.toString();
  }, [baseSrc, cacheKey]);

  useEffect(() => {
    try {
      setSameOrigin(new URL(src).origin === window.location.origin);
    } catch {
      setSameOrigin(false);
    }
  }, [src]);

  const reload = () => ref.current?.contentWindow?.location?.reload();
  const back = () => sameOrigin && ref.current?.contentWindow?.history?.back();
  const forward = () => sameOrigin && ref.current?.contentWindow?.history?.forward();
  const openNew = () => window.open(src, '_blank', 'noopener,noreferrer');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-gray-200 bg-white">
      <div className="flex items-center gap-2 p-2 border-b">
        <span className="font-semibold text-sm">Preview</span>
        <div className="ml-auto flex items-center gap-2">
          {sameOrigin ? (
            <>
              <button className="px-2 py-1 border rounded" onClick={back}>Back</button>
              <button className="px-2 py-1 border rounded" onClick={forward}>Forward</button>
            </>
          ) : (
            <button className="px-2 py-1 border rounded" onClick={openNew}>Open in new tab</button>
          )}
          <button className="px-2 py-1 border rounded" onClick={reload}>Reload</button>
        </div>
      </div>
      <iframe
        ref={ref}
        src={src}
        title="Astro Preview"
        className="w-full flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
});

export default PreviewPane;
