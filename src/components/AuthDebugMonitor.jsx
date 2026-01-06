import { useState, useEffect, useRef } from 'preact/hooks';
import { Terminal, Trash2, Download, Search, Pause, Play, Maximize2, Minimize2, Bug, Globe, Cpu, Shield, Database, ChevronRight, ChevronDown, Settings } from 'lucide-preact';

/**
 * # AuthDebugMonitor (Enhanced)
 *
 * A draggable, persistent, on-screen debug monitor for tracking application state,
 * API calls, authentication flow, and more. Now with deep tracing capabilities.
 */
const AuthDebugMonitor = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [expandedLogIds, setExpandedLogIds] = useState(new Set());
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        console: true,
        network: true,
        auth: true,
        system: true,
        resources: true
    });

    const logEndRef = useRef(null);

    // --- Helpers ---

    const sanitizeHeaders = (headers) => {
        const sanitized = {};
        if (!headers) return sanitized;
        
        // Handle Headers object or plain object
        const entries = headers.entries ? Array.from(headers.entries()) : Object.entries(headers);
        
        entries.forEach(([key, value]) => {
            if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie') || key.toLowerCase().includes('token')) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        });
        return sanitized;
    };

    const getSystemInfo = () => {
        return {
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            cookies: document.cookie ? 'Present (Redacted)' : 'None',
            time: new Date().toISOString(),
            referrer: document.referrer
        };
    };

    const toggleExpand = (id) => {
        setExpandedLogIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Effect for setting up global helpers, interceptors, and system logging
    useEffect(() => {
        // Load persisted logs
        const savedLogs = localStorage.getItem('auth_debug_logs');
        if (savedLogs) {
            try {
                setLogs(JSON.parse(savedLogs));
            } catch (e) {
                console.error('Failed to parse saved logs:', e);
            }
        }

        const addLog = (level, category, message, data) => {
            const newLog = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                level,
                category,
                message,
                data: data ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : null,
                url: window.location.href
            };

            setLogs(prev => {
                const updated = [...prev, newLog];
                const trimmed = updated.slice(-1000); 
                localStorage.setItem('auth_debug_logs', JSON.stringify(trimmed));
                return trimmed;
            });
        };

        // --- Log Initial System Info ---
        addLog('info', 'SYSTEM', 'Monitor Initialized', getSystemInfo());

        // --- Global Debug Object ---
        window.authDebug = {
            log: (category, message, data = null) => {
                if (!isPaused) addLog('info', category, message, data);
            },
            error: (category, message, data = null) => addLog('error', category, message, data),
            warn: (category, message, data = null) => addLog('warn', category, message, data),
            success: (category, message, data = null) => addLog('success', category, message, data),
            auth: (step, data = null) => addLog('info', 'AUTH', step, data),
            api: (method, url, status, data = null, duration = 0) => 
                addLog(status >= 400 ? 'error' : 'info', 'API', `${method} ${url} [${status}] ${duration}ms`, data),
            storage: (action, key, value = null) => addLog('info', 'STORAGE', `${action}: ${key}`, value),
            worker: (message, data = null) => addLog('info', 'WORKER', message, data),
            route: (from, to) => addLog('info', 'ROUTE', `${from} → ${to}`),
            state: (component, newState) => addLog('info', 'STATE', component, newState),
            system: (info) => addLog('info', 'SYSTEM', 'System Info Snapshot', info)
        };

        // --- Interceptors ---
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            const method = options?.method || 'GET';
            const startTime = performance.now();
            const reqHeaders = sanitizeHeaders(options?.headers || {});

            if (!isPaused) window.authDebug.log('API', `→ ${method} ${url}`, { headers: reqHeaders });

            try {
                const response = await originalFetch(...args);
                const duration = Math.round(performance.now() - startTime);
                
                // Check for specific Worker Debug Headers
                const workerLogs = response.headers.get('X-Worker-Logs') || response.headers.get('X-Debug-Log');
                if (workerLogs) {
                    window.authDebug.worker('Log from Backend', workerLogs);
                }

                const clonedResponse = response.clone();
                const resHeaders = sanitizeHeaders(clonedResponse.headers);

                let data;
                try {
                    data = await clonedResponse.json();
                } catch {
                    data = await clonedResponse.text(); // Fallback to text if JSON fails
                }

                const logData = {
                    requestHeaders: reqHeaders,
                    responseHeaders: resHeaders,
                    body: data
                };

                if (!isPaused) window.authDebug.api(method, url.toString(), response.status, logData, duration);

                return response;
            } catch (error) {
                const duration = Math.round(performance.now() - startTime);
                if (!isPaused) window.authDebug.error('API', `✗ ${method} ${url} (Failed after ${duration}ms)`, error.message);
                throw error;
            }
        };

        // --- Resource Timing Observer ---
        // Captures static resources like scripts, images, etc.
        const observer = new PerformanceObserver((list) => {
            if (isPaused) return;
            list.getEntries().forEach((entry) => {
                // Filter out fetch/xmlhttprequest as they are handled by the fetch interceptor
                if (['fetch', 'xmlhttprequest'].includes(entry.initiatorType)) return;
                
                addLog('info', 'RESOURCE', `${entry.name.split('/').pop()}`, {
                    type: entry.initiatorType,
                    duration: `${Math.round(entry.duration)}ms`,
                    size: entry.transferSize
                });
            });
        });
        
        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.warn('PerformanceObserver not supported for resources');
        }

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

        // Cleanup
        return () => {
            window.fetch = originalFetch;
            Storage.prototype.setItem = originalSetItem;
            Storage.prototype.removeItem = originalRemoveItem;
            observer.disconnect();
            delete window.authDebug;
        };
    }, [isPaused]); 

    // Scroll to bottom
    useEffect(() => {
        if (!isPaused && !expandedLogIds.size) { // Don't auto-scroll if user is inspecting details
            logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isPaused, expandedLogIds]);

    const clearLogs = () => {
        setLogs([]);
        localStorage.removeItem('auth_debug_logs');
    };

    const exportLogs = () => {
        // Filter based on checkboxes
        const logsToExport = logs.filter(log => {
            if (!exportOptions.console && log.level === 'info' && !['AUTH', 'API', 'SYSTEM', 'RESOURCE'].includes(log.category)) return false;
            if (!exportOptions.network && log.category === 'API') return false;
            if (!exportOptions.auth && log.category === 'AUTH') return false;
            if (!exportOptions.system && log.category === 'SYSTEM') return false;
            if (!exportOptions.resources && log.category === 'RESOURCE') return false;
            return true;
        });

        const dataStr = JSON.stringify(logsToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `debug-trace-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
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
        AUTH: 'bg-purple-900 text-purple-100',
        API: 'bg-blue-900 text-blue-100',
        STORAGE: 'bg-orange-900 text-orange-100',
        WORKER: 'bg-teal-900 text-teal-100',
        ROUTE: 'bg-indigo-900 text-indigo-100',
        STATE: 'bg-pink-900 text-pink-100',
        SYSTEM: 'bg-gray-700 text-gray-100',
        RESOURCE: 'bg-cyan-900 text-cyan-100'
    };

    // Minimized state view
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-5 right-5 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-110 z-50"
                title="Open Debug Monitor"
            >
                <Bug className="w-6 h-6" />
            </button>
        );
    }

    // Expanded state view
    return (
        <div
            className="fixed bottom-5 right-5 bg-gray-900 text-gray-100 rounded-lg shadow-2xl border border-gray-700 font-mono text-sm z-50 w-[800px] max-w-[95vw] flex flex-col"
            style={{ height: '600px', maxHeight: '80vh' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="font-bold">Auth Debug Monitor</span>
                    <span className="text-xs text-gray-500">({filteredLogs.length} logs)</span>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => window.authDebug.system(getSystemInfo())} className="p-1 hover:bg-gray-700 rounded" title="Log System Info">
                        <Cpu className="w-4 h-4" />
                    </button>
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
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)} 
                            className="px-3 py-1 bg-green-900 hover:bg-green-800 rounded flex items-center gap-1 text-xs" 
                            title="Export options"
                        >
                            <Download className="w-3 h-3" /> Export
                        </button>
                        
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl p-2 w-48 z-50">
                                <div className="text-xs font-bold mb-2 text-gray-400">Include in Export:</div>
                                {Object.keys(exportOptions).map(opt => (
                                    <label key={opt} className="flex items-center gap-2 text-xs mb-1 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={exportOptions[opt]} 
                                            onChange={(e) => setExportOptions(p => ({...p, [opt]: e.target.checked}))}
                                        />
                                        <span className="capitalize">{opt}</span>
                                    </label>
                                ))}
                                <button 
                                    onClick={exportLogs}
                                    className="mt-2 w-full bg-blue-600 hover:bg-blue-500 py-1 rounded text-xs"
                                >
                                    Download JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-1 text-xs flex-wrap">
                    {['all', 'info', 'error', 'warn', 'success', 'AUTH', 'API', 'SYSTEM', 'RESOURCE'].map(f => (
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
            <div className="overflow-y-auto p-3 space-y-2 flex-grow bg-black/20">
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No logs yet. Use window.authDebug.log() to start logging.
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log.id} className="border-l-2 border-gray-700 pl-3 py-1 hover:bg-gray-800/50 group">
                            <div className="flex items-center gap-2 text-xs cursor-pointer" onClick={() => toggleExpand(log.id)}>
                                <span className="text-gray-500 whitespace-nowrap font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${categoryColors[log.category] || 'bg-gray-700'}`}>{log.category}</span>
                                <span className={`flex-1 ${levelColors[log.level]} truncate`}>{log.message}</span>
                                {log.data && (
                                    <span className="text-gray-600 hover:text-white">
                                        {expandedLogIds.has(log.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </span>
                                )}
                            </div>
                            
                            {/* Expanded Details */}
                            {log.data && expandedLogIds.has(log.id) && (
                                <div className="mt-2 ml-4">
                                    <div className="bg-gray-950 p-2 rounded text-xs border border-gray-800 overflow-x-auto">
                                        <pre className="text-gray-300 font-mono text-[10px] leading-tight">
                                            {log.data}
                                        </pre>
                                    </div>
                                    <div className="mt-1 flex gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(log.data);
                                            }}
                                            className="text-[10px] text-blue-400 hover:underline"
                                        >
                                            Copy JSON
                                        </button>
                                    </div>
                                </div>
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
