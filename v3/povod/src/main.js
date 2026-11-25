import './style.css';
import './story.css';
import './occasions.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, $, $$, order, videoController } from './shared';
import { heroMarkup, landingMarkup, mountHero } from './scenes/hero';
import { occasionsMarkup, mountOccasions } from './scenes/occasions';
import { storyMarkup, mountStory } from './scenes/story';
import { giftMarkup, mountGift } from './scenes/gift';
import { sectionsMarkup, mountSections } from './scenes/sections';

const main = $('#main');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let current = '', context, videos, hero, story, gift, lenis, ticker, revision = 0, navigating = false;
const routeKey = () => order.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
history.scrollRestoration = 'manual';

function setScroll(y) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  ScrollTrigger.update();
}

function startLenis(reduced) {
  if (ticker) gsap.ticker.remove(ticker);
  lenis?.destroy(); lenis = null; window.__lenis = null;
  if (reduced) return;
  lenis = new Lenis({ lerp: .085, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  ticker = t => lenis.raf(t * 1000);
  gsap.ticker.add(ticker); gsap.ticker.lagSmoothing(0);
}

async function render(key, restore = 0) {
  const token = ++revision;
  const reduced = motionPreference.matches;
  window.__povod = { ready: false };
  hero?.destroy(); story?.destroy(); gift?.destroy(); videos?.destroy();
  context?.revert();
  gsap.killTweensOf('.phone-annotation h3,.phone-annotation p,.hero-slide .visual,.slide-progress i');
  current = key;
  document.documentElement.classList.toggle('motion', !reduced);
  document.documentElement.classList.toggle('reduced', reduced);
  document.body.dataset.route = key;
  main.innerHTML = key === 'home'
    ? heroMarkup() + occasionsMarkup() + giftMarkup('wedding') + sectionsMarkup(null)
    : landingMarkup(key) + storyMarkup(key) + giftMarkup(key) + sectionsMarkup(key);
  document.title = key === 'home' ? 'Повод - ваши люди, ваши истории' : `${({ wedding: 'Свадьба', birthday: 'День рождения', anniversary: 'Годовщина', jubilee: 'Юбилей' })[key]} - Повод`;
  startLenis(reduced);
  setScroll(0);
  videos = videoController(main, reduced);
  context = gsap.context(() => {
    hero = mountHero(reduced, () => videos?.sync());
    mountOccasions(reduced);
    story = key === 'home' ? null : mountStory(key, reduced);
    gift = mountGift(key === 'home' ? 'wedding' : key, reduced);
    mountSections(reduced);
  }, main);
  await document.fonts.ready;
  await Promise.all($$('img', main).map(img => img.decode().catch(() => {})));
  if (token !== revision) return;
  await new Promise(resolve => requestAnimationFrame(resolve));
  lenis?.resize(); ScrollTrigger.refresh(); gift?.sync?.();
  setScroll(restore);
  videos.sync();
  window.__povod = {
    ready: true, route: key, reducedMotion: reduced,
    metrics: () => ['hero', 'occasions', 'story', 'phone'].map(id => ScrollTrigger.getById(id)).filter(Boolean).map(t => ({ id: t.vars.id, start: t.start, end: t.end, length: t.end - t.start, progress: t.progress })),
    settle() {
      ScrollTrigger.update();
      ScrollTrigger.getAll().forEach(t => {
        const tw = t.getTween?.();
        if (tw && typeof tw.progress === 'function') tw.progress(1);
        if (!t.vars.scrub && t.isActive) t.animation?.progress(1);
      });
      story?.settle?.(); gift?.sync?.(); videos.sync();
    },
    setSlide: n => hero?.change?.(n),
    freezeHero: () => hero?.freeze?.(),
    navigate: key => navigate(key),
    storyScenes: () => story?.scenes || [],
    sampleStory: p => { story?.timeline?.progress(Math.max(0, Math.min(1, p))); story?.settle?.(); videos.sync(); },
  };
}

async function navigate(key, anchor) {
  if (navigating) return;
  const next = order.includes(key) ? key : 'home';
  if (next === current) { setScroll(0); return; }
  navigating = true;
  history.replaceState({ route: current, y: scrollY }, '', location.href);
  const source = $('img', anchor || document.createElement('div'));
  const rect = source?.getBoundingClientRect();
  const flight = $('.route-flight');
  if (source && rect.width && !motionPreference.matches && next !== 'home') {
    flight.innerHTML = `<img src="${source.currentSrc || source.src}" alt="">`;
    gsap.set(flight, { display: 'block', left: rect.left, top: rect.top, width: rect.width, height: rect.height, opacity: 1, borderRadius: 8 });
  }
  history.pushState({ route: next, y: 0 }, '', `#${next}`);
  try {
    await render(next);
    if (flight.childElementCount) {
      await gsap.to(flight, { left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: 0, duration: .9, ease: 'power3.inOut' });
      gsap.set(flight, { display: 'none' }); flight.replaceChildren();
    }
    main.focus({ preventScroll: true });
  } finally { navigating = false; }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const trigger = ScrollTrigger.getById(id);
  const y = trigger ? trigger.start : el.getBoundingClientRect().top + scrollY - 90;
  if (lenis) lenis.scrollTo(y, { duration: 1.25 }); else el.scrollIntoView();
}

document.addEventListener('click', async e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  const hash = a.hash.slice(1);
  if (a.hasAttribute('data-scroll')) {
    e.preventDefault();
    if (a.dataset.scroll === 'occasions' && current !== 'home') { await navigate('home'); }
    scrollToSection(a.dataset.scroll);
    if (a.dataset.plan) $('[name="plan"]').value = a.dataset.plan;
    if (a.hasAttribute('data-own')) $('[name="occasion"]').value = 'Свой повод';
    return;
  }
  if (order.includes(hash) || hash === 'home') { e.preventDefault(); await navigate(hash, a); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'request-form') return;
  e.preventDefault();
  $('.form-note', e.target).textContent = 'Это макет: заявка не отправляется. В рабочей версии она придёт нам в Telegram.';
});
addEventListener('popstate', async e => {
  await render(routeKey(), e.state?.y || 0);
});
addEventListener('hashchange', () => {
  if (routeKey() !== current) render(routeKey());
});
motionPreference.addEventListener('change', () => render(current, 0));
matchMedia('(max-width: 767px)').addEventListener('change', async () => {
  const active = ScrollTrigger.getAll().find(t => t.vars.id && t.isActive);
  const id = active?.vars.id, progress = active?.progress;
  await render(current, 0);
  const next = id && ScrollTrigger.getById(id);
  if (next) setScroll(next.start + (next.end - next.start) * progress);
});
addEventListener('scroll', () => {
  $('.navigation').classList.toggle('nav-solid', scrollY > innerHeight * .86);
}, { passive: true });
await render(routeKey());
history.replaceState({ route: current, y: 0 }, '', location.href);
if (!order.includes(location.hash.slice(1)) && document.getElementById(location.hash.slice(1))) scrollToSection(location.hash.slice(1));
