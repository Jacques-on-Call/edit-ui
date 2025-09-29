import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from './postcss.config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss,
  },
  server: {
    proxy: {
      // Proxy /api requests to the Cloudflare Worker dev server
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})