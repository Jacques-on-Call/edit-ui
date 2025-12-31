import { h, createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

const LogContext = createContext();

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev.slice(-99), args.join(' ')]); // Keep last 100 logs
    };

    // Capture errors as well
    const originalError = console.error;
    console.error = (...args) => {
        originalError(...args);
        setLogs(prev => [...prev.slice(-99), `[ERROR] ${args.join(' ')}`]);
    };

    return () => {
        console.log = originalLog;
        console.error = originalError;
    };
  }, []);

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = logs.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch (e) {
        console.error('Fallback copy failed', e);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const value = { logs, copyLogs };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export const useLogs = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
