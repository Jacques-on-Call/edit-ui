import React, { useEffect, useRef } from 'react';

function PreviewPage() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource('/preview-server/sse');

    eventSource.onmessage = (event) => {
      if (event.data === 'reload') {
        console.log('🔄 Reloading preview...');
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error, connection closed.', error);
      eventSource.close();
    };

    // Clean up the connection when the component unmounts
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src="/preview-server/"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Live Preview"
      />
    </div>
  );
}

export default PreviewPage;