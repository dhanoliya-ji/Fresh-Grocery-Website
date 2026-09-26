import { defineConfig } from 'vite';

// base './' makes every asset path relative, so the built site works on GitHub Pages
// (https://<user>.github.io/<repo>/) as well as any other static host.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 800 },
});
