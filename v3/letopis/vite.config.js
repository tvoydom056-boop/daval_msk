import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{name:'critical-page-bootstrap',transformIndexHtml:{order:'post',handler:html=>html.replace(/<script type="module" crossorigin src=/g,'<script type="module" blocking="render" crossorigin src=')}}],
  build: { assetsInlineLimit: 0,rollupOptions:{input:{
    home:'index.html',life:'examples/life.html',family:'examples/family.html',maria:'examples/maria.html',sergey:'examples/sergey.html',page:'examples/page.html',families:'families.html',docs:'docs.html',
  }} },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
