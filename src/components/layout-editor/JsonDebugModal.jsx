import React from 'react';

const JsonDebugModal = ({ json, onClose }) => {
  const formattedJson = JSON.stringify(json, null, 2);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-gray-100 rounded-lg shadow-xl p-6 w-full max-w-2xl h-3/4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Live Layout State (JSON)</h2>
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
                Close
            </button>
        </div>
        <pre className="flex-grow bg-gray-900 p-4 rounded-md overflow-auto text-sm">
          <code>{formattedJson}</code>
        </pre>
      </div>
    </div>
  );
};

export default JsonDebugModal;