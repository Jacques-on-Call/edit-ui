import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EditorRouter from '../components/layout-editor/EditorRouter';
import ErrorBoundary from '../components/ErrorBoundary';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import { astroToState } from '../utils/astroToState';
import { markerizeAstro } from '../lib/layouts/markerizeAstro';
import MarkerizeModal from '../components/layout-editor/MarkerizeModal';

const LayoutEditorPage = () => {
  const [initialBlueprint, setInitialBlueprint] = useState(null);
  const [initialState, setInitialState] = useState(null);
  const [hasMarkers, setHasMarkers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileSha, setFileSha] = useState(null); // To store the file's sha for updates
  const [pendingUnmarked, setPendingUnmarked] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const repo = localStorage.getItem('selectedRepo');
    const ref = localStorage.getItem('selectedBranch') || 'main';
    const isNew = searchParams.get('new') === '1';

    if (filePath && repo) {
      const fetchAndParseLayout = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setFileSha(null);

          if (isNew) {
            setInitialBlueprint(null);
            setHasMarkers(true);
            return;
          }

          const response = await fetch(`/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(ref)}`, {
            credentials: 'include',
          });

          if (!response.ok) {
            if (response.status === 404) {
              if (filePath.endsWith('.astro')) {
                setInitialBlueprint(null);
                setHasMarkers(true);
              } else {
                setInitialState(null);
                setHasMarkers(false);
              }
            } else if (response.status === 401) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || 'Unauthorized. Check GITHUB_TOKEN.');
            } else {
              throw new Error(`Failed to fetch layout (status: ${response.status}).`);
            }
          } else {
            const { content, sha } = await response.json();
            setFileSha(sha);

            const blueprint = parseAstroToBlueprint(content);
            if (blueprint) {
              setInitialBlueprint(blueprint);
              setHasMarkers(true);
            } else if (filePath.endsWith('.astro')) {
              setPendingUnmarked({ path: filePath, content: content });
            } else {
              const state = await astroToState(content);
              setInitialState(state);
              setHasMarkers(false);
            }
          }
        } catch (err) {
          console.error('Error loading layout:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndParseLayout();
    } else {
      setIsLoading(false);
      setHasMarkers(false);
      setInitialState(null);
    }
  }, [location.search]);

  if (isLoading) {
    return <div className="text-white text-center p-8">Loading layout...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">Error: {error}</div>;
  }

  const searchParams = new URLSearchParams(location.search);
  const filePath = searchParams.get('path');

  const handleProceedWithMarkers = () => {
    if (!pendingUnmarked) return;

    const { content: markerizedContent } = markerizeAstro(pendingUnmarked.content);
    const blueprint = parseAstroToBlueprint(markerizedContent);

    setInitialBlueprint(blueprint);
    setHasMarkers(true);
    setPendingUnmarked(null);
  };

  const handleCancelMarkerize = () => {
    // Fallback to content mode if cancelled
    const state = astroToState(pendingUnmarked.content);
    setInitialState(state);
    setHasMarkers(false);
    setPendingUnmarked(null);
  };

  if (pendingUnmarked) {
    return (
      <MarkerizeModal
        isOpen={!!pendingUnmarked}
        onClose={handleCancelMarkerize}
        onProceed={handleProceedWithMarkers}
        originalContent={pendingUnmarked.content}
      />
    );
  }

  return (
    <ErrorBoundary>
      <EditorRouter
        initialBlueprint={initialBlueprint}
        initialState={initialState}
        filePath={filePath}
        fileSha={fileSha} // <-- Pass sha down
        hasMarkers={hasMarkers}
      />
    </ErrorBoundary>
  );
};

export default LayoutEditorPage;
