import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LayoutEditor from '../components/layout-editor/LayoutEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import { astroToState } from '../utils/astroToState';

const LayoutEditorPage = () => {
  const [layoutState, setLayoutState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const repo = localStorage.getItem('selectedRepo');

    if (filePath && repo) {
      const fetchAndParseLayout = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${filePath}`);
          if (!response.ok) {
            throw new Error('Failed to fetch layout content.');
          }
          const astroContent = await response.text();
          const initialState = await astroToState(astroContent);
          setLayoutState(initialState);
        } catch (error) {
          console.error('Error loading layout:', error);
          // Set a default error state or handle it appropriately
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndParseLayout();
    } else {
      // Handle case where there is no file path (e.g., new layout)
      setIsLoading(false);
    }
  }, [location.search]);

  if (isLoading) {
    return <div>Loading layout...</div>;
  }

  return (
    <ErrorBoundary>
      <LayoutEditor initialState={layoutState} />
    </ErrorBoundary>
  );
};

export default LayoutEditorPage;