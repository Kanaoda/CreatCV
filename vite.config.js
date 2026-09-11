import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so GitHub Pages project URLs and local preview both resolve assets.
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 2999,
    strictPort: true,
    open: 'http://localhost:2999/',
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild'
  }
});
