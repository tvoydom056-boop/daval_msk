import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };
export const order = ['wedding', 'birthday', 'anniversary', 'jubilee'];
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const vh = (n) => innerHeight * n / 100;
export const media = (path) => `${import.meta.env.BASE_URL}media/${path.replace(/^assets\//, '')}`;
export const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const image = (path, alt = '', extra = '') => `<img src="${media(path)}" alt="${esc(alt)}" decoding="async" ${extra}>`;
export const visual = (name, path, slot, extra = '') => `<div class="visual ${extra}" data-slot="${esc(slot)}">${image(path)}${name ? `<video muted loop playsinline preload="none" poster="${media(path)}" data-src="${media(`v2/video/${name}.mp4`)}" aria-hidden="true"></video>` : ''}</div>`;
export const lines = (text, limit = 36) => {
  const result = []; let line = '';
  text.split(' ').forEach(word => {
    if ((line + ' ' + word).length > limit && line) { result.push(line); line = word; }
    else line += (line ? ' ' : '') + word;
  });
  if (line) result.push(line);
  return result;
};
export const maskedLines = (text, limit) => lines(text, limit).map(t => `<span class="line-mask"><span>${esc(t)}</span></span>`).join('');
export const pin = (id, element, length, options = {}) => gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: { id, trigger: element, start: 'top top', end: () => `+=${vh(length)}`, pin: true, scrub: .65, invalidateOnRefresh: true, ...options },
});

// Intersection alone cannot tell whether an absolutely positioned scene is hidden.
// Scene owners also set data-playing; a single observer enforces both conditions.
export function videoController(root, reduced) {
  const visible = new Set();
  const videos = $$('video', root);
  let destroyed = false;
  const allowed = v => !reduced && !document.hidden && visible.has(v) && !v.closest('[data-playing="false"]') && (!v.closest('[data-hover-video]') || v.closest('[data-hover-video]').matches(':hover,:focus-within'));
  function sync() {
    videos.forEach(v => {
      if (!allowed(v)) { v.pause(); return; }
      if (!v.hasAttribute('src')) { v.src = v.dataset.src; v.muted = true; }
      if (v.paused) v.play().catch(() => {});
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    sync();
  }, { threshold: .02 });
  videos.forEach(v => {
    observer.observe(v);
    v.addEventListener('error', () => { v.style.visibility = 'hidden'; });
  });
  const mutation = new MutationObserver(sync);
  mutation.observe(root, { attributes: true, subtree: true, attributeFilter: ['data-playing'] });
  const hover = () => { if (!destroyed) sync(); };
  root.addEventListener('pointerover', hover);
  root.addEventListener('pointerout', hover);
  root.addEventListener('focusin', hover);
  root.addEventListener('focusout', hover);
  document.addEventListener('visibilitychange', sync);
  return { sync, destroy() {
    destroyed = true; observer.disconnect(); mutation.disconnect();
    ['pointerover', 'pointerout', 'focusin', 'focusout'].forEach(type => root.removeEventListener(type, hover));
    document.removeEventListener('visibilitychange', sync);
    videos.forEach(v => v.pause());
  } };
}
