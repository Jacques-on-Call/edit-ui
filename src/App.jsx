import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import RepositorySelectionPage from './pages/RepositorySelectionPage';
import ExplorerPage from './pages/ExplorerPage';

function App() {
  return (
    <Routes>
      {/* Standalone routes without the AppLayout */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Routes that use the AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/repository-selection" element={<RepositorySelectionPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        {/* Add a route for file viewer as well, anticipating the next step */}
        <Route path="/explorer/file" element={<div>File Viewer Placeholder</div>} />
      </Route>
    </Routes>
  );
}

export default App;