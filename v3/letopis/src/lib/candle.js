import {home} from '../content/home.js';
import {escapeHTML as e} from './core.js';
import {siteURL} from './shell.js';

export function candleMarkup({tone='dark'}={}){
  const data=home.candle;
  return `<section class="home-section${tone==='dark'?' home-dark':' memory-section memory-candle'}" id="candle" data-theme="${tone}" data-tone="${tone}"><div class="home-wrap candle-layout"><div><p class="eyebrow">${e(data.kicker)}</p><h2>${e(data.title)}</h2><p class="section-note">${e(data.text)}</p><button class="home-button primary" id="light-candle" type="button" aria-pressed="false">${e(data.button)}</button><p class="candle-count" role="status"><span id="candle-count">0</span> ${e(data.counter)}</p></div><div class="candle-image" data-slot="Свеча памяти"><img class="candle-base" src="${siteURL('media/home/candle-unlit.png')}" alt="Свеча памяти" width="1254" height="1254"><img class="candle-lit" src="${siteURL('media/home/candle.png')}" alt="" width="1254" height="1254" aria-hidden="true"><i class="candle-glow" aria-hidden="true"></i></div></div></section>`;
}

export function initCandle({key,root=document.querySelector('#candle')}){
  if(!root||root.dataset.candleReady)return;
  root.dataset.candleReady='true';
  const button=root.querySelector('#light-candle'),count=root.querySelector('#candle-count');
  let lit=false;
  try{lit=localStorage.getItem(key)==='1';}catch{/* Retain the state for this visit when storage is unavailable. */}
  function show(){root.classList.toggle('is-lit',lit);count.textContent=lit?'1':'0';button.setAttribute('aria-pressed',String(lit));button.disabled=lit;}
  button.addEventListener('click',()=>{
    if(lit)return;
    lit=true;try{localStorage.setItem(key,'1');}catch{/* The candle still lights for this visit. */}
    show();
  });
  addEventListener('storage',event=>{if(event.key===key&&event.newValue==='1'){lit=true;show();}});
  show();
}
