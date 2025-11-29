import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const cookie = req.headers.cookie;
            if (cookie) {
              proxyReq.setHeader('Cookie', cookie);
            }
          });
        },
      },
    },
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
