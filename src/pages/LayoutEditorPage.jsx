import React from 'react';
import { LayoutEditor } from '../components/layout-editor/LayoutEditor';
import ErrorBoundary from '../components/ErrorBoundary';

const LayoutEditorPage = () => {
  return (
    <ErrorBoundary>
      <LayoutEditor />
    </ErrorBoundary>
  );
};

export default LayoutEditorPage;