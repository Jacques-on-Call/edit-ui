import React, { useEffect, useRef, useState } from 'react';

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000; // 3 seconds

function PreviewPage() {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const reconnectAttempts = useRef(0);
  const eventSourceRef = useRef(null);

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('Connection failed. Max reconnect attempts reached.');
      console.error('SSE connection failed permanently.');
      return;
    }

    setStatus('Connecting to preview server...');
    eventSourceRef.current = new EventSource('/preview-server/sse');

    eventSourceRef.current.onopen = () => {
      setStatus('Connected');
      console.log('SSE connection opened.');
      reconnectAttempts.current = 0; // Reset on successful connection
    };

    eventSourceRef.current.onmessage = (event) => {
      if (event.data === 'reload') {
        setStatus('Change detected. Reloading preview...');
        console.log('🔄 Reloading preview...');
        if (iframeRef.current) {
          // A simple way to force iframe reload
          iframeRef.current.src = iframeRef.current.src;
        }
        setTimeout(() => setStatus('Connected'), 1000);
      } else if (event.data === 'connected') {
        setStatus('Connected');
      } else if (event.data !== 'heartbeat') {
        console.log('Received SSE message:', event.data);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      setStatus('Connection error. Retrying...');
      console.error('SSE error, attempting to reconnect.', error);
      eventSourceRef.current.close();
      reconnectAttempts.current++;
      setTimeout(connect, RECONNECT_INTERVAL);
    };
  };

  useEffect(() => {
    connect();

    // Clean up the connection when the component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '8px', backgroundColor: '#F5F5F5', borderBottom: '1px solid #ddd', fontFamily: 'sans-serif', fontSize: '14px' }}>
        <strong>Preview Status:</strong> {status}
      </div>
      <iframe
        ref={iframeRef}
        src="/preview-server/"
        style={{ flexGrow: 1, border: 'none' }}
        title="Live Preview"
      />
    </div>
  );
}

export default PreviewPage;