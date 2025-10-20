import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      // The general proxy for all other API calls to the Wrangler server
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
