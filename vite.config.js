import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Specific routes for the build-trigger server must come first
      '/api/trigger-build': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/build-status': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // A general catch-all for all other API calls to the Wrangler server
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  define: {
    'global': 'window',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})