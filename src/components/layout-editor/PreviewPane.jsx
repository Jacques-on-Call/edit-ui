import React from 'react';

const PreviewPane = ({ compiledCode, validationErrors }) => {
  return (
    <div className="sticky top-4">
      <h2 className="text-xl font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">Live Preview</h2>
      <div className="bg-slate-800 rounded-lg p-4">
        <pre className="text-sm overflow-auto font-mono h-[60vh] text-slate-200">
          {compiledCode}
        </pre>
      </div>
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
          <p className="font-semibold">Validation Errors:</p>
          <ul className="list-disc list-inside mt-1">
            {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PreviewPane;
