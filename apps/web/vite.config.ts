import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split large vendor libs into separate cached chunks.
        // These rarely change, so browsers can reuse them across deploys.
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
