import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EditorRouter from '../components/layout-editor/EditorRouter';
import ErrorBoundary from '../components/ErrorBoundary';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import { astroToState } from '../utils/astroToState';

const LayoutEditorPage = () => {
  const [initialBlueprint, setInitialBlueprint] = useState(null);
  const [initialState, setInitialState] = useState(null);
  const [hasMarkers, setHasMarkers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const repo = localStorage.getItem('selectedRepo');

    if (filePath && repo) {
      const fetchAndParseLayout = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${filePath}`);

          if (!response.ok) {
            if (response.status === 404) {
              // File doesn't exist, so determine editor based on file path
              if (filePath.endsWith('.astro')) {
                setInitialBlueprint(null); // New layout file
                setHasMarkers(true);
              } else {
                setInitialState(null); // New content file
                setHasMarkers(false);
              }
            } else {
              throw new Error(`Failed to fetch layout content (status: ${response.status}).`);
            }
          } else {
            const astroContent = await response.text();
            const blueprint = parseAstroToBlueprint(astroContent);
            if (blueprint) {
              setInitialBlueprint(blueprint);
              setHasMarkers(true);
            } else {
              const state = await astroToState(astroContent);
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
      // No path, default to new content file
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

  return (
    <ErrorBoundary>
      <EditorRouter
        initialBlueprint={initialBlueprint}
        initialState={initialState}
        filePath={filePath}
        hasMarkers={hasMarkers}
      />
    </ErrorBoundary>
  );
};

export default LayoutEditorPage;
