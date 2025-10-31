import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './global.css';
import App from './App.jsx';
import { initialize } from '@astrojs/compiler';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Initialize the Astro compiler's WASM module and export the promise.
// This must be done once at startup. Other modules can await this promise
// to ensure the compiler is ready before using it.
export const astroCompilerReady = initialize({ wasmURL: '/astro.wasm' });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);