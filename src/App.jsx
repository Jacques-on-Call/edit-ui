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

function App() {
  return (
    <DndProvider backend={TouchBackend} options={dndOptions}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/repository-selection" element={<RepositorySelectionPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<ExplorerPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/layouts" element={<LayoutsDashboardPage />} />
          <Route path="/layout-editor" element={<LayoutEditorPage />} />
          <Route path="/semantic-layout-editor" element={<SemanticLayoutEditor />} />
        </Route>
      </Routes>
    </DndProvider>
  );
}

export default App;