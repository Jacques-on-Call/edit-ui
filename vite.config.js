import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/trigger-build': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trigger-build/, '/api/trigger-build'),
      },
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