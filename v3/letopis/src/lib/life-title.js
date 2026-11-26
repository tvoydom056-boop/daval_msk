import '../life.css';
import {gsap} from './core.js';
import {letters} from './text.js';

export function mountLifeTitle(root){
  root.querySelector('.chapter-stage').insertAdjacentHTML('afterbegin',`<header class="life-title" data-theme="dark">
    <div class="life-title-copy"><p class="life-title-format">История жизни</p><h1 id="life-title-name">Пётр Соколов</h1><p class="life-title-years">1909-1943 · фронтовик, плотник из Покровского</p></div>
    <p class="life-title-scroll">Листайте</p>
  </header>`);
  root.setAttribute('aria-labelledby','life-title-name');
  const name=root.querySelector('#life-title-name');
  name.setAttribute('aria-label',name.textContent);
  name.innerHTML='<span class="life-title-word" aria-hidden="true">Пётр</span> <span class="life-title-word" aria-hidden="true">Соколов</span>';
  name.querySelectorAll('.life-title-word').forEach(word=>letters(word));
}

export function animateLifeTitle(root){
  const title=root.querySelector('.life-title');if(!title)return;
  const chars=title.querySelectorAll('.written-char');
  gsap.set(title,{autoAlpha:1,filter:'blur(0px)',y:0});
  gsap.set(chars,{opacity:0,yPercent:40,filter:'blur(6px)'});
  return gsap.timeline().to(chars,{opacity:1,yPercent:0,filter:'blur(0px)',duration:1.1,stagger:.055,ease:'power2.out'},.1);
}
