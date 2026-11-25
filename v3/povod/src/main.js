import './style.css';
import { OCCASIONS } from './data';
import { order, $ } from './dom';
import { heroMarkup, landingMarkup } from './scenes/hero';
import { occasionsMarkup } from './scenes/occasions';
import { giftMarkup, mountGift } from './scenes/gift';
import { sectionsMarkup, planOptions, allowedPlanIds } from './scenes/sections';

const main = $('#main');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let current = '', gift, scrollFrame = 0, restoring = false;
const draft = { name: '', contact: '', date: '', occasion: 'unknown', plan: 'unknown' };
history.scrollRestoration = 'manual';

function saveDraft() {
  const form = $('#request-form');
  if (!form) return;
  Object.keys(draft).forEach(name => { draft[name] = form.elements[name].value; });
}

function syncPlans() {
  const form = $('#request-form');
  const occasion = form.elements.occasion.value;
  const selected = form.elements.plan.value;
  form.elements.plan.innerHTML = planOptions(occasion, allowedPlanIds(occasion).includes(selected) ? selected : 'unknown');
}

function closeMenu() {
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#primary-nav').classList.remove('is-open');
}

function rememberPosition() {
  if (restoring || history.state?.route !== current) return;
  history.replaceState({ route: current, y: scrollY, exampleOpen: $('#gift-example').open }, '', location.href);
}

function render(key, restore = 0, focus = false, exampleOpen = false) {
  restoring = true;
  saveDraft();
  gift?.destroy();
  current = key;
  document.body.dataset.route = key;
  main.innerHTML = (key === 'home' ? heroMarkup() + occasionsMarkup() : landingMarkup(key))
    + giftMarkup(key === 'home' ? 'jubilee' : key) + sectionsMarkup(key === 'home' ? null : key);
  document.title = key === 'home' ? 'Повод - сайт-подарок с вашей историей' : `${OCCASIONS[key].short} - сайт-подарок | Повод`;
  const form = $('#request-form');
  ['name', 'contact', 'date'].forEach(name => { form.elements[name].value = draft[name]; });
  form.elements.occasion.value = key === 'home' ? draft.occasion : key;
  form.elements.plan.innerHTML = planOptions(form.elements.occasion.value, draft.plan);
  syncPlans();
  gift = mountGift();
  $('#gift-example').open = exampleOpen;
  closeMenu();
  if (focus) main.focus({ preventScroll: true });
  window.scrollTo({ top: restore, behavior: 'instant' });
  window.__povod = { ready: true, route: key, reducedMotion: motionPreference.matches, navigate };
  requestAnimationFrame(() => { restoring = false; });
}

function navigate(key) {
  const next = order.includes(key) ? key : 'home';
  if (next === current) { closeMenu(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
  rememberPosition();
  history.pushState({ route: next, y: 0 }, '', `#${next}`);
  render(next, 0, true);
}

function scrollToSection(id, focus = false) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  if (focus) {
    const heading = $('h2', target);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  closeMenu();
}

document.addEventListener('click', e => {
  if (e.target.closest('#menu-toggle')) {
    const button = $('#menu-toggle');
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    $('#primary-nav').classList.toggle('is-open', open);
    return;
  }
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  if (e.target.closest('[data-example]')) {
    e.preventDefault();
    $('#gift-example').open = true;
    scrollToSection('gift-example');
    $('#gift-example > summary').focus({ preventScroll: true });
    return;
  }
  const a = e.target.closest('a[href^="#"]');
  if (!a) { if (!e.target.closest('.navigation')) closeMenu(); return; }
  if (a.classList.contains('skip-link')) {
    e.preventDefault(); main.focus({ preventScroll: true }); scrollToSection('main'); return;
  }
  if (a.hasAttribute('data-scroll')) {
    e.preventDefault();
    const id = a.dataset.scroll;
    if (id === 'occasions' && current !== 'home') navigate('home');
    if (a.hasAttribute('data-own') || (a.dataset.occasion && a.dataset.occasion !== 'unknown')) {
      $('[name="occasion"]').value = a.hasAttribute('data-own') ? 'custom' : a.dataset.occasion;
      syncPlans();
    }
    if (a.dataset.plan) {
      const selected = a.dataset.plan;
      const occasion = $('[name="occasion"]').value;
      const available = allowedPlanIds(occasion).includes(selected);
      $('[name="plan"]').value = available ? selected : 'unknown';
      $('#request-status').textContent = available ? '' : 'Для свадьбы доступны «История» и «Премиум». Выберите один из них в поле «Формат».';
    }
    scrollToSection(id, true);
    return;
  }
  const key = a.hash.slice(1);
  if (order.includes(key) || key === 'home') { e.preventDefault(); navigate(key); }
});

document.addEventListener('change', e => {
  if (e.target.matches('#request-form [name="occasion"]')) syncPlans();
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'request-form') return;
  e.preventDefault();
  $('#request-status').textContent = 'Это макет: заявка не отправлена, данные никуда не переданы.';
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#menu-toggle').getAttribute('aria-expanded') === 'true') {
    closeMenu(); $('#menu-toggle').focus();
  }
});

function restoreRoute(state) {
  const key = location.hash.slice(1);
  if (order.includes(key) || key === 'home' || !key) {
    const next = key || 'home';
    if (next !== current) render(next, state?.y || 0, true, state?.exampleOpen || false);
  } else if (!document.getElementById(key)) {
    history.replaceState({ route: 'home', y: 0 }, '', '#home'); render('home', 0, true);
  }
}
addEventListener('popstate', e => restoreRoute(e.state));
addEventListener('hashchange', () => restoreRoute(history.state));
addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; rememberPosition(); });
}, { passive: true });
document.addEventListener('toggle', e => { if (e.target.id === 'gift-example') rememberPosition(); }, true);
matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);
motionPreference.addEventListener('change', () => { window.__povod.reducedMotion = motionPreference.matches; });

const initial = location.hash.slice(1);
const firstRoute = order.includes(initial) ? initial : 'home';
render(firstRoute);
history.replaceState({ route: firstRoute, y: 0 }, '', order.includes(initial) || initial === 'home' ? location.href : '#home');
if (initial && initial !== 'home' && !order.includes(initial)) {
  requestAnimationFrame(() => scrollToSection(initial));
}
