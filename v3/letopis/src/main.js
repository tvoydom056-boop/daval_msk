import './style.css';
import './scenes.css';
import './presentation.css';
import './tree.css';
import './embed.css';
import './book.css';
import './flow.css';
import './navigation.css';
import './home.css';
import './family-tree.css';
import './family-pages.css';
import './memory-page.css';
import './families.css';
import './lib/style-audit.js';
import {mountShell} from './lib/shell.js';
import {startRuntime} from './lib/runtime.js';
import {prepareImages} from './lib/images.js';
export async function boot(mount){
  // Pick the layout before mounting, so the underlay never moves into the viewport.
  document.documentElement.classList.toggle('motion-ready',!matchMedia('(prefers-reduced-motion: reduce)').matches);
  mountShell();
  const setup=mount();
  prepareImages();
  await startRuntime(setup);
  // Only first-screen imagery participates in the incoming snapshot.
  const poster=document.querySelector('main video[poster]')?.poster;
  const cover=document.querySelector('.memory-cover-image img');
  if(cover)await cover.decode().catch(()=>{});
  else if(poster){const image=new Image();image.src=poster;await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1200))]);}
}
