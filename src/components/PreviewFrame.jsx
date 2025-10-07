import React, { useState, useEffect } from 'react';

function PreviewFrame({ src, onReload }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // When the src changes (e.g., on rebuild), reset the loading state.
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    console.log('High-fidelity preview iframe loaded successfully.');
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error('Failed to load high-fidelity preview iframe.');
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // onReload is expected to trigger the build process again in the parent.
    onReload();
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
        <p className="font-semibold text-red-700 mb-4">Failed to load preview</p>
        <p className="text-sm text-red-600 text-center mb-6">This can happen if the build process failed or if there was a network issue.</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
        >
          Retry Build
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading high-fidelity preview...</p>
        </div>
      )}
      <iframe
        src={src}
        title="High-Fidelity Preview"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full border-0 ${isLoading ? 'invisible' : 'visible'}`}
      />
    </div>
  );
}

export default PreviewFrame;