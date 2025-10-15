import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
      {/* Routes outside the main layout do not get the DndProvider */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/repository-selection" element={<RepositorySelectionPage />} />

      {/*
        FIX: The DndProvider now wraps only the main AppLayout.
        This provides drag-and-drop context to the editor without interfering
        with the login page or other standalone routes.
      */}
      <Route
        element={
          <DndWrapper>
            <AppLayout />
          </DndWrapper>
        }
      >
        <Route path="/" element={<ExplorerPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/layouts" element={<LayoutsDashboardPage />} />
        <Route path="/layout-editor" element={<LayoutEditorPage />} />
        <Route path="/semantic-layout-editor" element={<SemanticLayoutEditor />} />
      </Route>
    </Routes>
  );
}

export default App;