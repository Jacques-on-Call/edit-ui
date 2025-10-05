import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  // This tells Vite to replace any instance of 'global' with 'window',
  // which is the correct global object in a browser environment.
  define: {
    'global': 'window',
  },
  // This is the definitive fix for the 'Buffer is not defined' error.
  // It ensures that any import for the 'buffer' module is correctly
  // redirected to the browser-safe version.
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
})