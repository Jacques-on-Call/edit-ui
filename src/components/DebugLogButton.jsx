import { useState, useEffect } from 'preact/hooks';

export function FloatingLogButton() {
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev.slice(-99), args.join(' ')]); // Keep last 100 logs
    };

    return () => { console.log = originalLog; };
  }, []);

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      alert('Logs copied!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = logs.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Logs copied!');
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 10001
      }}>
        {logs.length > 0 && (
          <button
            onClick={copyLogs}
            style={{
              padding: '10px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Copy {logs.length} Logs
          </button>
        )}

        <button
          onClick={() => setShowLogs(!showLogs)}
          style={{
            padding: '12px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
        >
          📋
        </button>
      </div>

      {showLogs && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'black',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          maxHeight: '200px',
          overflow: 'auto',
          fontSize: '12px',
          zIndex: 10001
        }}>
          {logs.slice(-10).map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </>
  );
}
