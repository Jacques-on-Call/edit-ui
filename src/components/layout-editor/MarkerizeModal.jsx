import React, { useMemo } from 'react';
import { markerizeAstro } from '../../lib/layouts/markerizeAstro';
import Icon from '../Icon';

const MarkerizeModal = ({ isOpen, onClose, onProceed, originalContent }) => {
  const { content: markedContent, report } = useMemo(() => {
    return markerizeAstro(originalContent);
  }, [originalContent]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add Editor Markers</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-700">
            <Icon name="close" className="text-white" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 text-slate-300">
          <p className="mb-4">
            This Astro layout doesn't have the required editor markers. To edit it in Layout Mode, we need to add them.
          </p>
          <p className="mb-6">
            Below is a preview of the changes. No files will be modified until you save.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh]">
            <div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">Original</h3>
              <pre className="h-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm overflow-auto font-mono">
                {originalContent}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">With Markers</h3>
              <pre className="h-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm overflow-auto font-mono">
                {markedContent}
              </pre>
            </div>
          </div>

          {report.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 text-sm">
              <p className="font-semibold">Warnings:</p>
              <ul className="list-disc list-inside mt-1">
                {report.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </main>

        <footer className="flex justify-end items-center p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-white hover:bg-slate-700 transition-colors mr-3"
          >
            Cancel (Open in Content Mode)
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Proceed
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MarkerizeModal;
