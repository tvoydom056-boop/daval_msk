import '../candle.css';
import {home} from '../content/home.js';
import {escapeHTML as e} from './core.js';
import {siteURL} from './shell.js';
import {candleCountText} from './candle-count.js';
import {createCandleFlame} from './candle-flame.js';

export {candleCountText} from './candle-count.js';

export function candleMarkup({tone='dark'}={}){
  const data=home.candle;
  return `<section class="candle-section home-section${tone==='dark'?' home-dark':' candle-tone-paper memory-section memory-candle'}" id="candle" data-scene="candle" data-theme="${tone}" data-tone="${tone}"><div class="candle-room-glow" aria-hidden="true"></div><div class="home-wrap candle-layout"><div><p class="eyebrow">${e(data.kicker)}</p><h2>${e(data.title)}</h2><p class="section-note">${e(data.text)}</p><button class="home-button primary" id="light-candle" type="button" aria-pressed="false">${e(data.button)}</button><p class="candle-count" role="status"><span id="candle-count" hidden></span> <span class="candle-count-label">${e(candleCountText(0))}</span></p></div><div class="candle-image" data-slot="Свеча памяти"><img class="candle-base" src="${siteURL('media/home/candle-unlit.png')}" alt="Свеча памяти" width="1254" height="1254"><i class="candle-aura" aria-hidden="true"></i><i class="candle-wax-light" aria-hidden="true"></i><canvas class="candle-flame" aria-hidden="true"></canvas><canvas class="candle-air" aria-hidden="true"></canvas></div></div></section>`;
}

export function initCandle({key,root=document.querySelector('#candle')}){
  if(!root||root.dataset.candleReady)return;
  root.dataset.candleReady='true';root.dataset.candleKey=key;
  const button=root.querySelector('#light-candle'),count=root.querySelector('#candle-count'),label=root.querySelector('.candle-count-label');
  const flame=createCandleFlame(root);
  let lit=false;
  try{lit=localStorage.getItem(key)==='1';}catch{/* The candle still works when storage is unavailable. */}
  function show(){
    const value=lit?1:0,text=candleCountText(value);
    root.dataset.candleCount=String(value);count.hidden=!value;count.textContent=value?String(value):'';label.textContent=value?text.slice(String(value).length+1):text;
    button.setAttribute('aria-pressed',String(lit));button.disabled=false;
    button.textContent=lit?'Свеча горит':home.candle.button;
  }
  button.addEventListener('click',()=>{
    if(lit){flame.pulse();return;}
    lit=true;try{localStorage.setItem(key,'1');}catch{/* Retain the light for this visit. */}
    show();flame.setLit(true,{animate:true});
  });
  addEventListener('storage',event=>{if(event.key===key&&event.newValue==='1'&&!lit){lit=true;show();flame.setLit(true);}});
  show();flame.setLit(lit);
}
