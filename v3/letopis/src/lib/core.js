import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const vh = n => innerHeight * n / 100;
export const vw = n => document.documentElement.clientWidth * n / 100;
export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const emphasis = value => escapeHTML(value).replace(/\*([^*]+)\*/g, '<em>$1</em>');
export const media = name => `${document.body.dataset.root||'./'}media/${name}`;
export const sceneVideo = name => `<video muted loop playsinline preload="none" poster="${media(name+'.jpg')}" aria-hidden="true"><source data-src="${media(name+'.mp4')}" type="video/mp4"></video>`;
export const prop = (name, alt, className = '') => `<img class="prop ${className}" src="${media(name+'.png')}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async" data-slot="${escapeHTML(alt)}">`;
export function pinTimeline(id, distance, scrub = 1.2) {
  const root = document.getElementById(id);
  root.dataset.pinVh = distance;
  return gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
    id,trigger:root,start:'top top',pin:root.querySelector('.scene-stage'),
    end:()=>`+=${vh(distance)}`,scrub,invalidateOnRefresh:true,
  }});
}
export function drawPaths(timeline, selector, at, duration, stagger = .35) {
  const paths = gsap.utils.toArray(selector);
  paths.forEach(path => {
    const length = path.getTotalLength();
    gsap.set(path,{strokeDasharray:length,strokeDashoffset:length});
  });
  timeline.to(paths,{strokeDashoffset:0,duration,stagger},at);
}

// One visibility gate for videos, procedural graphics and inertia.
const visible = new Set();
const animations = new Set();
let reducedMotion = false;
let touched=false;
export const canLoadVideo=()=>!reducedMotion&&(!matchMedia('(max-width: 767px)').matches||touched);
const near=root=>{const rect=root.getBoundingClientRect();return rect.top<innerHeight*1.9&&rect.bottom>-innerHeight*.9;};
export function addFrame(root, draw, {fps = 60} = {}) {
  const item = {root,draw,interval:1000/fps,last:0};
  animations.add(item);
  return () => animations.delete(item);
}
export const isVisible = root => visible.has(root) && !document.hidden;
export function loadMedia(root) {
  if(!canLoadVideo()||!near(root))return;
  $$('video',root).forEach(video=>{
    const source=video.querySelector('source[data-src]');
    if(source&&!source.getAttribute('src')){video.preload='none';source.src=source.dataset.src;video.load();}
  });
}
export function initMedia() {
  const roots = $$('[data-scene], .paper-section');
  const load = loadMedia;
  const preload = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting)load(entry.target);
  }),{rootMargin:`${Math.round(innerHeight*.9)}px`});
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const root=entry.target;
    if(entry.isIntersecting)visible.add(root);else visible.delete(root);
    $$('video',root).forEach(video => {
      if(entry.isIntersecting&&canLoadVideo()&&!document.hidden){load(root);video.play()?.catch(()=>{});}
      else video.pause();
    });
  }));
  roots.forEach(root=>{preload.observe(root);observer.observe(root);});
  document.addEventListener('visibilitychange',()=>roots.forEach(root=>$$('video',root).forEach(video=>{
    if(isVisible(root)&&canLoadVideo()){load(root);video.play()?.catch(()=>{});}else video.pause();
  })));
  // There are no mobile encodes in this edition: keep posters until a real touch.
  document.addEventListener('pointerdown',event=>{
    if(!event.isTrusted||event.pointerType!=='touch'||touched)return;
    touched=true;
    roots.filter(near).forEach(root=>{load(root);if(isVisible(root))$$('video',root).forEach(video=>video.play()?.catch(()=>{}));});
  },{passive:true});
  gsap.ticker.add((time, delta) => {
    if(document.hidden)return;
    animations.forEach(item=>{
      if(!reducedMotion&&visible.has(item.root)&&time*1000-item.last>=item.interval){
        item.draw(time,Math.min(delta,50)/1000);
        item.last=time*1000-((time*1000-item.last)%item.interval);
      }
    });
  });
}
export function setMediaReduced(value) {
  reducedMotion=value;
  $$('video').forEach(video=>{
    const root=video.closest('[data-scene],.paper-section');
    if(canLoadVideo()&&isVisible(root)){loadMedia(root);video.play()?.catch(()=>{});}else video.pause();
  });
}
