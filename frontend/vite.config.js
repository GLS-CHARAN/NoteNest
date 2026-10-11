import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy makes the browser think the API lives on the same origin (localhost:5173).
// That keeps the HttpOnly auth cookie simple and avoids CORS problems in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5080', changeOrigin: false } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
