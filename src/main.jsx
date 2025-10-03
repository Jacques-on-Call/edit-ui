import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Callback from './Callback.jsx';
import ExplorerPage from './ExplorerPage.jsx';
import FileViewerPage from './FileViewerPage.jsx';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/explorer/file" element={<FileViewerPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);