import { h } from 'preact';
import { useLogs } from '../contexts/LogContext';
import { useState } from 'preact/hooks';
import { Copy, Trash2, ChevronUp, Check } from 'lucide-preact';

export function FloatingLogButton() {
  const { logs, copyLogs } = useLogs();
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  if (logs.length === 0) return null;

  const handleCopy = async () => {
    const success = await copyLogs();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[10001] flex flex-col items-end gap-2">
        {showLogs && (
          <div className="w-80 h-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 flex flex-col">
            <div className="flex-grow overflow-y-auto text-xs text-gray-300 font-mono">
              {logs.map((log, i) => (
                <div key={i} className={`whitespace-pre-wrap ${log.startsWith('[ERROR]') ? 'text-red-400' : ''}`}>{log}</div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs text-gray-500">{logs.length} entries</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
        >
          <ChevronUp size={24} className={`transition-transform ${showLogs ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </>
  );
}
