import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vite.dev/config/
// This is a separate Vite config specifically for Playwright tests.
// It is identical to the main vite.config.js EXCEPT it removes the API proxy.
// This allows Playwright to fully control and mock API requests during tests
// without interference from the Vite dev server's proxying behavior.
export default defineConfig({
  plugins: [preact()],
  server: {
    host: true,
    // The API proxy is intentionally removed for testing.
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  optimizeDeps: {
    include: ['preact', 'preact/compat', 'react', 'react-dom'],
  },
  ssr: {
    noExternal: ['preact', 'preact/compat', 'react', 'react-dom'],
  },
});
