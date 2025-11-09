import { useState, useEffect, useRef } from 'preact/hooks';
import { Terminal, Trash2, Download, Search, Pause, Play, Maximize2, Minimize2, Bug } from 'lucide-preact';

/**
 * # AuthDebugMonitor
 *
 * A draggable, persistent, on-screen debug monitor for tracking application state,
 * API calls, authentication flow, and more.
 *
 * ## How to Use
 *
 * This component, when rendered, exposes a global object: `window.authDebug`.
 * You can use this object anywhere in the application to log messages to the monitor.
 *
 * ### Logging Methods:
 *
 * - `window.authDebug.log(category, message, data)`: For general information.
 * - `window.authDebug.error(category, message, data)`: For errors.
 * - `window.authDebug.warn(category, message, data)`: For warnings.
 * - `window.authDebug.success(category, message, data)`: For success events.
 *
 * ### Specialized Logging Methods:
 *
 * - `window.authDebug.auth(step, data)`: Log an authentication step (e.g., 'GitHub Callback Received').
 * - `window.authDebug.api(method, url, status, data)`: Log an API call. Automatically hooked into `fetch`.
 * - `window.authDebug.storage(action, key, value)`: Log localStorage actions. Automatically hooked.
 * - `window.authDebug.worker(message, data)`: Log messages from a Web Worker context.
 * - `window.authDebug.route(from, to)`: Log a frontend route change.
 * - `window.authDebug.state(component, newState)`: Log a component state change.
 *
 * ## Automatic Interception
 *
 * - **Fetch API:** All `fetch` requests are automatically logged, including method, URL, status, and response body.
 * - **LocalStorage:** `setItem` and `removeItem` calls are automatically logged.
 */
const AuthDebugMonitor = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true); // Start minimized
    const logEndRef = useRef(null);

    // Effect for setting up global helpers and interceptors
    useEffect(() => {
        // Load persisted logs from localStorage
        const savedLogs = localStorage.getItem('auth_debug_logs');
        if (savedLogs) {
            try {
                setLogs(JSON.parse(savedLogs));
            } catch (e) {
                console.error('Failed to parse saved logs:', e);
            }
        }

        // --- Global Debug Object ---
        window.authDebug = {
            log: (category, message, data = null) => {
                if (!isPaused) addLog('info', category, message, data);
            },
            error: (category, message, data = null) => addLog('error', category, message, data),
            warn: (category, message, data = null) => addLog('warn', category, message, data),
            success: (category, message, data = null) => addLog('success', category, message, data),
            auth: (step, data = null) => addLog('info', 'AUTH', step, data),
            api: (method, url, status, data = null) => addLog(status >= 400 ? 'error' : 'info', 'API', `${method} ${url} [${status}]`, data),
            storage: (action, key, value = null) => addLog('info', 'STORAGE', `${action}: ${key}`, value),
            worker: (message, data = null) => addLog('info', 'WORKER', message, data),
            route: (from, to) => addLog('info', 'ROUTE', `${from} → ${to}`),
            state: (component, newState) => addLog('info', 'STATE', component, newState)
        };

        // --- Interceptors ---
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            const method = options?.method || 'GET';

            if (!isPaused) window.authDebug.log('API', `→ ${method} ${url}`, options);

            try {
                // The original implementation was missing the second argument `options`,
                // which includes critical settings like `credentials: 'include'`.
                const response = await originalFetch(...args);
                const clonedResponse = response.clone();

                try {
                    const data = await clonedResponse.json();
                    if (!isPaused) window.authDebug.api(method, url.toString(), response.status, data);
                } catch {
                    if (!isPaused) window.authDebug.api(method, url.toString(), response.status, 'Non-JSON response');
                }

                return response;
            } catch (error) {
                if (!isPaused) window.authDebug.error('API', `✗ ${method} ${url}`, error.message);
                throw error;
            }
        };


        const originalSetItem = Storage.prototype.setItem;
        const originalRemoveItem = Storage.prototype.removeItem;

        Storage.prototype.setItem = function(key, value) {
            if (key !== 'auth_debug_logs' && !isPaused) {
                window.authDebug.storage('SET', key, value);
            }
            return originalSetItem.call(this, key, value);
        };

        Storage.prototype.removeItem = function(key) {
            if (key !== 'auth_debug_logs' && !isPaused) {
                window.authDebug.storage('REMOVE', key);
            }
            return originalRemoveItem.call(this, key);
        };

        // Cleanup function
        return () => {
            window.fetch = originalFetch;
            Storage.prototype.setItem = originalSetItem;
            Storage.prototype.removeItem = originalRemoveItem;
            delete window.authDebug;
        };
    }, [isPaused]); // Rerun if isPaused changes to re-hook console logs

    const addLog = (level, category, message, data) => {
        const newLog = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data: data ? JSON.stringify(data, null, 2) : null,
            url: window.location.href
        };

        setLogs(prev => {
            const updated = [...prev, newLog];
            const trimmed = updated.slice(-1000); // Keep last 1000 logs
            localStorage.setItem('auth_debug_logs', JSON.stringify(trimmed));
            return trimmed;
        });
    };

    useEffect(() => {
        if (!isPaused) {
            logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isPaused]);

    const clearLogs = () => {
        setLogs([]);
        localStorage.removeItem('auth_debug_logs');
    };

    const exportLogs = () => {
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auth-debug-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const filteredLogs = logs.filter(log => {
        if (filter !== 'all' && log.level !== filter && log.category !== filter) return false;
        if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const levelColors = {
        info: 'text-blue-400',
        error: 'text-red-400',
        warn: 'text-yellow-400',
        success: 'text-green-400'
    };

    const categoryColors = {
        AUTH: 'bg-purple-900',
        API: 'bg-blue-900',
        STORAGE: 'bg-orange-900',
        WORKER: 'bg-teal-900',
        ROUTE: 'bg-indigo-900',
        STATE: 'bg-pink-900'
    };

    // Minimized state view
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-5 right-5 bg-bark-blue text-white p-3 rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-110 z-50"
                title="Open Debug Monitor"
            >
                <Bug className="w-6 h-6" />
            </button>
        );
    }

    // Expanded state view
    return (
        <div
            className="fixed bottom-5 right-5 bg-gray-900 text-gray-100 rounded-lg shadow-2xl border border-gray-700 font-mono text-sm z-50 w-[600px] max-w-[90vw] flex flex-col"
            style={{ maxHeight: '70vh' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="font-bold">Auth Debug Monitor</span>
                    <span className="text-xs text-gray-500">({filteredLogs.length} logs)</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPaused(!isPaused)} className="p-1 hover:bg-gray-700 rounded" title={isPaused ? 'Resume' : 'Pause'}>
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-700 rounded" title="Minimize">
                        <Minimize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="p-3 bg-gray-850 border-b border-gray-700 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button onClick={clearLogs} className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded flex items-center gap-1 text-xs" title="Clear logs">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                    <button onClick={exportLogs} className="px-3 py-1 bg-green-900 hover:bg-green-800 rounded flex items-center gap-1 text-xs" title="Export logs">
                        <Download className="w-3 h-3" /> Export
                    </button>
                </div>
                <div className="flex gap-1 text-xs flex-wrap">
                    {['all', 'info', 'error', 'warn', 'success', 'AUTH', 'API', 'STORAGE', 'WORKER', 'ROUTE', 'STATE'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2 py-1 rounded ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs */}
            <div className="overflow-y-auto p-3 space-y-2 flex-grow">
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No logs yet. Use window.authDebug.log() to start logging.
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log.id} className="border-l-2 border-gray-700 pl-3 py-1 hover:bg-gray-800/50">
                            <div className="flex items-start gap-2 text-xs">
                                <span className="text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`px-2 py-0.5 rounded text-xs text-white ${categoryColors[log.category] || 'bg-gray-700'}`}>{log.category}</span>
                                <span className={levelColors[log.level]}>{log.level.toUpperCase()}</span>
                            </div>
                            <div className="mt-1 text-gray-300 break-words">{log.message}</div>
                            {log.data && (
                                <pre className="mt-1 p-2 bg-gray-950 rounded text-xs overflow-x-auto text-gray-400">{log.data}</pre>
                            )}
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default AuthDebugMonitor;
