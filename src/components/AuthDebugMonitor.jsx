import { useEffect, useState } from 'preact/hooks';
import Icon from './Icon';
import './AuthDebugMonitor.css';

// --- Developer Notes ---
//
// **Purpose:**
// The AuthDebugMonitor is a persistent, site-wide debugging tool designed to provide real-time
// visibility into the application's state, particularly for authentication, API calls, and
// local storage events. It remains in the application codebase to assist with ongoing
// maintenance and troubleshooting.
//
// **How to Use:**
// A global `window.authDebug` object is available in all components when this monitor is active.
// You can add new logging calls anywhere in the application to trace events.
//
// **Available Log Functions:**
//
// 1. `window.authDebug.log(type, ...args)`
//    - Generic logging for custom categories.
//    - `type` (string): A short, uppercase category name (e.g., 'UI', 'ROUTING').
//    - `...args` (any): One or more values to log (strings, objects, etc.).
//    - Example: `window.authDebug.log('UI', 'Modal opened', { modalId: 'user-settings' });`
//
// 2. `window.authDebug.warn(type, ...args)`
//    - For logging non-critical warnings. Will be highlighted in yellow.
//    - Example: `window.authDebug.warn('API', 'API response took longer than 2s');`
//
// 3. `window.authDebug.error(type, ...args)`
//    - For logging errors. Will be highlighted in red.
//    - Example: `window.authDebug.error('API', 'Failed to fetch user data', error);`
//
// 4. `window.authDebug.success(type, ...args)`
//    - For logging successful operations. Will be highlighted in green.
//    - Example: `window.authDebug.success('AUTH', 'User successfully logged in', userData);`
//
// **Pre-defined Log Types (Shortcuts):**
// These are helpers for common logging categories.
//
// 5. `window.authDebug.auth(...args)`
//    - Shortcut for `window.authDebug.log('AUTH', ...args)`.
//    - Used for authentication-related events (login, logout, session checks).
//
// 6. `window.authDebug.storage(...args)`
//    - Shortcut for `window.authDebug.log('STORAGE', ...args)`.
//    - Used for localStorage or cookie interactions.
//
// 7. `window.authDebug.api(...args)`
//    - Shortcut for `window.authDebug.log('API', ...args)`.
//    - Used for logging fetch requests and responses.
//
// --- End Developer Notes ---


// --- Helper Functions ---
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function formatMessage(args) {
  return args
    .map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, getCircularReplacer(), 2);
        } catch (e) {
          return '[Unserializable Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [copyButtonText, setCopyButtonText] = useState('Copy All');

  useEffect(() => {
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

    window.authDebug = {
      log: (type, ...args) => addLog(type, 'log', ...args),
      warn: (type, ...args) => addLog(type, 'warn', ...args),
      error: (type, ...args) => addLog(type, 'error', ...args),
      success: (type, ...args) => addLog(type, 'success', ...args),
      auth: (...args) => addLog('AUTH', 'log', ...args),
      storage: (...args) => addLog('STORAGE', 'log', ...args),
      api: (...args) => addLog('API', 'log', ...args),
    };

    addLog('MONITOR', 'success', 'AuthDebugMonitor initialized.');

    return () => {
      delete window.authDebug;
    };
  }, []);

  const handleCopyAll = () => {
    if (logs.length === 0) return;

    const formattedLogs = logs
      .map(log => `${log.timestamp} [${log.type}] ${log.message}`)
      .join('\n');

    navigator.clipboard.writeText(formattedLogs).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy All'), 2000);
    }).catch(err => {
      console.error('Failed to copy logs:', err);
      setCopyButtonText('Error!');
      setTimeout(() => setCopyButtonText('Copy All'), 2000);
    });
  };

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.type === filter);
  const logTypes = ['ALL', ...Array.from(new Set(logs.map(log => log.type)))];

  if (isMinimized) {
    return (
      <button
        className="auth-debug-monitor-bug-btn"
        onClick={() => setIsMinimized(false)}
        title="Show Debugger"
      >
        <Icon name="bug" className="h-8 w-8 text-white" />
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
          <button onClick={handleCopyAll}>{copyButtonText}</button>
          <button onClick={() => setLogs([])}>Clear</button>
          <button onClick={() => setIsMinimized(true)}>Minimize</button>
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
