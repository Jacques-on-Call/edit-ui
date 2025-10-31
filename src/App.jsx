import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import RepositorySelectionPage from './pages/RepositorySelectionPage';
import ExplorerPage from './pages/ExplorerPage';
import EditorPage from './pages/EditorPage';
import LayoutsDashboardPage from './pages/LayoutsDashboardPage';
import VisualEditorPage from './pages/VisualEditorPage';
import AuthDebugMonitor from './components/AuthDebugMonitor';

function App() {
  return (
    <>
      <AuthDebugMonitor />
      <Routes>
        {/* Standalone routes that should NOT have the main AppLayout. */}
        <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/*
        All routes that ARE part of the main application experience are nested here.
        They will all render inside the AppLayout.
      */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/explorer" replace />} />
        <Route path="repository-selection" element={<RepositorySelectionPage />} />
        <Route path="explorer" element={<ExplorerPage />} />
        <Route path="editor" element={<EditorPage />} />
        <Route path="layouts" element={<LayoutsDashboardPage />} />
        <Route path="visual-editor" element={<VisualEditorPage />} />
        <Route path="layout-editor" element={<VisualEditorPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;