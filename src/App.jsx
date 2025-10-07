import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import RepositorySelectionPage from './pages/RepositorySelectionPage';
import ExplorerPage from './pages/ExplorerPage';
import EditorPage from './pages/EditorPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Routes>
      {/* Standalone routes without the AppLayout */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      <Route path="/repository-selection" element={<RepositorySelectionPage />} />

      {/* Routes that use the AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/editor" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
      </Route>
    </Routes>
  );
}

export default App;