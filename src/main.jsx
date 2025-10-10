import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './global.css';
import App from './App.jsx';
import { initialize } from '@astrojs/compiler';

// Initialize the Astro compiler's WASM module.
// This must be done once at startup before any parsing functions are called.
// It returns a promise, but we don't need to await it here.
// The app can render while the WASM is loading in the background.
initialize();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);