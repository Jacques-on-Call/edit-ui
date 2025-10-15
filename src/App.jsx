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
      {/*
        FIX: Standalone routes that should NOT have the main AppLayout or DndProvider.
        This includes the login flow and the repository selection page.
      */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/repository-selection" element={<RepositorySelectionPage />} />

      {/*
        All routes that ARE part of the main application experience are nested here.
        They will all render inside the AppLayout and have access to the DndProvider.
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