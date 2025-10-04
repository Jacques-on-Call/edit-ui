import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import RepositorySelectionPage from './pages/RepositorySelectionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/repository-selection" element={<RepositorySelectionPage />} />
    </Routes>
  );
}

export default App;