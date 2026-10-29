import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  // Build time for the homepage's live status card (the commit comes from
  // VITE_BUILD_SHA, set by the deploy workflow)
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  build: {
    rollupOptions: {
      output: {
        // Split large vendor libs into separate cached chunks.
        // These rarely change, so browsers can reuse them across deploys.
        // (Client build only: the prerender's SSR build leaves dependencies external.)
        manualChunks: isSsrBuild ? undefined : {
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
}));
