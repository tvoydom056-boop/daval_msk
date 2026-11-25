import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 0 },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
