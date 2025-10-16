import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';

import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import RepositorySelectionPage from './pages/RepositorySelectionPage';
import ExplorerPage from './pages/ExplorerPage';
import EditorPage from './pages/EditorPage';
import LayoutsDashboardPage from './pages/LayoutsDashboardPage';
import LayoutEditorPage from './pages/LayoutEditorPage';
import SemanticLayoutEditor from './pages/SemanticLayoutEditor';

// Options for the TouchBackend, enabling mouse events for desktop compatibility.
const dndOptions = {
  enableMouseEvents: true,
};

// A new wrapper component to apply the DndProvider only to routes that need it.
const DndWrapper = ({ children }) => (
  <DndProvider backend={TouchBackend} options={dndOptions}>
    {children}
  </DndProvider>
);

function App() {
  return (
    <Routes>
      {/* Standalone routes that should NOT have the main AppLayout. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/repository-selection" element={<RepositorySelectionPage />} />

      {/*
        All routes that ARE part of the main application experience are nested here.
        They will all render inside the AppLayout.
      */}
      <Route path="/" element={<AppLayout />}>
        {/*
          FIX: Add a root-level redirect. If the user is authenticated and lands at "/",
          this will automatically send them to the explorer, preventing a blank page.
        */}
        <Route index element={<Navigate to="/explorer" replace />} />

        {/* The ExplorerPage is the only one that needs react-dnd, so we wrap it here. */}
        <Route
          path="explorer"
          element={
            <DndWrapper>
              <ExplorerPage />
            </DndWrapper>
          }
        />
        <Route path="editor" element={<EditorPage />} />
        <Route path="layouts" element={<LayoutsDashboardPage />} />
        {/* LayoutEditorPage now correctly does NOT have the DndProvider from react-dnd */}
        <Route path="layout-editor" element={<LayoutEditorPage />} />
        <Route path="semantic-layout-editor" element={<SemanticLayoutEditor />} />
      </Route>
    </Routes>
  );
}

export default App;