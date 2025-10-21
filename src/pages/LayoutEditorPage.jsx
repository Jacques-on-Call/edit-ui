import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import LayoutEditor from '../components/layout-editor/LayoutEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import { astroToState } from '../utils/astroToState';

const LayoutEditorPage = () => {
  const [layoutState, setLayoutState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const repo = localStorage.getItem('selectedRepo');

    if (!filePath) {
      setError('No layout path provided. Open a layout from the Layouts dashboard.');
      setIsLoading(false);
      return;
    }

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
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndParseLayout();
    } else {
      setError('Missing repository selection. Please select a repository first.');
      setIsLoading(false);
    }
  }, [location.search]);

  if (isLoading) return <div className="p-8 text-center">Loading layout…</div>;
  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/layouts" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Go to Layouts
        </Link>
      </div>
    );
  }

  const searchParams = new URLSearchParams(location.search);
  const filePath = searchParams.get('path');

  return (
    <ErrorBoundary>
      <LayoutEditor initialState={layoutState} filePath={filePath} />
    </ErrorBoundary>
  );
};

export default LayoutEditorPage;
