import { useEffect, useState } from 'preact/hooks';
import './AuthDebugMonitor.css';

// --- Helper Functions ---
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function formatMessage(args) {
  return args
    .map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Pretty print with 2-space indentation, handle circular refs
          return JSON.stringify(arg, getCircularReplacer(), 2);
        } catch (e) {
          return '[Unserializable Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

// Handles circular references in JSON.stringify
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};


// --- The Component ---
function AuthDebugMonitor() {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type, level, ...args) => {
      setLogs(prevLogs => [
        ...prevLogs,
        {
          id: Date.now() + Math.random(),
          timestamp: getTimestamp(),
          type,
          level,
          message: formatMessage(args),
        },
      ]);
    };

    // Define the global debug object
    window.authDebug = {
      log: (type, ...args) => addLog(type, 'log', ...args),
      warn: (type, ...args) => addLog(type, 'warn', ...args),
      error: (type, ...args) => addLog(type, 'error', ...args),
      success: (type, ...args) => addLog(type, 'success', ...args),
      auth: (...args) => addLog('AUTH', 'log', ...args),
      storage: (...args) => addLog('STORAGE', 'log', ...args),
      api: (...args) => addLog('API', 'log', ...args),
    };

    // Optional: You can also override console methods to capture all logs
    // console.log = (...args) => { addLog('CONSOLE', 'log', ...args); originalLog.apply(console, args); };
    // console.warn = (...args) => { addLog('CONSOLE', 'warn', ...args); originalWarn.apply(console, args); };
    // console.error = (...args) => { addLog('CONSOLE', 'error', ...args); originalError.apply(console, args); };


    addLog('MONITOR', 'success', 'AuthDebugMonitor initialized.');

    return () => {
      // Restore original console methods on cleanup
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      delete window.authDebug;
    };
  }, []);

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.type === filter);
  const logTypes = ['ALL', ...Array.from(new Set(logs.map(log => log.type)))];

  if (!isVisible) {
    return (
      <button
        className="auth-debug-monitor-toggle-btn"
        onClick={() => setIsVisible(true)}
      >
        Show Debugger
      </button>
    );
  }

  return (
    <div className="auth-debug-monitor-container">
      <div className="auth-debug-monitor-header">
        <h2>Auth Debug Monitor</h2>
        <div>
          <select onChange={(e) => setFilter(e.target.value)} value={filter}>
            {logTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <button onClick={() => setLogs([])}>Clear</button>
          <button onClick={() => setIsVisible(false)}>Hide</button>
        </div>
      </div>
      <pre className="auth-debug-monitor-logs">
        {filteredLogs.map(log => (
          <div key={log.id} className={`log-entry log-${log.level}`}>
            <span className="log-timestamp">{log.timestamp}</span>
            <span className={`log-type log-type-${log.type}`}>{log.type}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default AuthDebugMonitor;