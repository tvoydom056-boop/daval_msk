import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const vh = (n) => window.innerHeight * n / 100;
const vw = (n) => document.documentElement.clientWidth * n / 100;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
$('.medal-metal').style.setProperty('--medal-mask', `url("${new URL('./media/medal.png', document.baseURI).href}")`);
$('.hero-fog-back video').playbackRate = .85;
$('.hero-fog-front video').playbackRate = .55;
$('.scene-fog video').playbackRate = .5;
const digits = $$('.digit-strip');
digits.forEach((strip) => {
  strip.innerHTML = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('');
});

let lastYear = '';
function setYear(value) {
  const year = String(Math.round(value));
  if (year === lastYear) return;
  digits.forEach((strip, index) => {
    strip.style.transform = `translate3d(0,${-Number(year[index]) * 1.15}em,0)`;
  });
  $('.year').dataset.year = year;
  $('.year').setAttribute('aria-label', year);
  lastYear = year;
}
setYear(1909);

const quote = $('.last-quote');
const quoteText = quote.textContent;
quote.innerHTML = quoteText.split(' ').map((word) => `<span class="quote-word">${word}</span>`).join(' ');
quote.setAttribute('aria-label', quoteText);
$$('.quote-word').forEach((word) => word.setAttribute('aria-hidden', 'true'));

let lenis;
let intro;
let ticker;
let motionContext;

function makeFilm() {
  const mobile = window.innerWidth < 768;
  document.documentElement.classList.add('motion-ready');
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  ticker = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);

  motionContext = gsap.context(() => {
    gsap.set('.hero-video', { scale: 1.18 });
    gsap.set('.letter-mask > span', { yPercent: 116 });
    gsap.set('.hero-script', { opacity: 0, y: 24 });
    gsap.set('.hero-description, .scroll-invitation', { opacity: 1, y: 0 });
    gsap.set('.hero-fog-back', { yPercent: 75, opacity: 0 });
    gsap.set('.hero-fog-front', { yPercent: 100, opacity: 0 });
    gsap.set('.hero-haze, .hero-black', { opacity: 0 });

    intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro.to('.hero-video', { scale: 1, duration: 2.4 }, 0)
      .to('.letter-mask > span', { yPercent: 0, stagger: .045, duration: 1.45 }, .15)
      .to('.hero-script', { y: 0, opacity: 1, duration: 1.6 }, .5);

    const hero = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'hero', trigger: '.hero', start: 'top top', end: () => `+=${vh(115)}`,
        pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { if (self.progress > .005 && intro.progress() < 1) intro.progress(1); },
      },
    });
    hero.addLabel('home', 0)
      .to('.hero-camera', { scale: 1.14, y: () => -vh(6), duration: 100 }, 0)
      .to('.hero-type', { y: () => -vh(28), opacity: 0, filter: 'blur(8px)', duration: 62 }, 0)
      .fromTo('.hero-description, .scroll-invitation', { opacity: 1, y: 0 }, { opacity: 0, y: () => -vh(9), duration: 21, immediateRender: false }, 14)
      .addLabel('fog-rise', 35)
      .to('.hero-fog-back', { yPercent: -38, x: () => -vw(3), opacity: 1, duration: 37 }, 35)
      .to('.hero-fog-front', { yPercent: -12, x: () => vw(4), opacity: .85, duration: 37 }, 35)
      .to('.hero-camera', { opacity: 0, duration: 22 }, 50)
      .to('.hero-haze', { opacity: .94, duration: 22 }, 50)
      .addLabel('fog-cover', 72)
      .to('.hero-fog-back', { yPercent: -55, x: () => -vw(5), duration: 16 }, 72)
      .to('.hero-fog-front', { yPercent: -24, x: () => vw(6), duration: 16 }, 72)
      .to('.hero-black', { opacity: 1, duration: 16 }, 72)
      .addLabel('black', 88);

    gsap.set('.field', { clipPath: 'inset(0% 50% 0% 50%)', opacity: 1 });
    gsap.set('.war-video', { scale: 1.28 });
    gsap.set('.field-shade', { opacity: 0 });
    gsap.set('.field-dim', { opacity: 0 });
    gsap.set('.scene-fog', { opacity: 0, x: 0 });
    gsap.set('.year', { xPercent: -50, x: 0, opacity: 1, color: 'rgba(201,137,74,0)' });
    gsap.set('.front-copy .line-mask > span', { yPercent: 120 });
    gsap.set('.war-photo', { y: vh(70), rotationX: 28, rotationZ: -10, opacity: 0 });
    gsap.set('.photo-surface', { filter: 'invert(1) sepia(.6) contrast(1.4) drop-shadow(0px 4px 6px rgba(0,0,0,.1))' });
    gsap.set('.triangle', { x: vw(55), y: -vh(50), rotation: 65, rotationX: 24, opacity: 0 });
    gsap.set('.open-letter', { rotationY: 90, rotationZ: -1, opacity: 0 });
    gsap.set('.letter-writing p span', { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set('.letter-count', { opacity: 0, y: 15 });
    gsap.set('.medal', { y: -vh(60), rotation: -7, opacity: 0 });
    gsap.set('.medal-glint', { xPercent: -120 });
    gsap.set('.medal-copy .line-mask > span', { yPercent: 120 });
    gsap.set('.quote-word', { opacity: 0, filter: 'blur(6px)' });
    gsap.set('.quote-source, .final-fog, .paper-wash', { opacity: 0 });
    gsap.set('.epilogue', { autoAlpha: 0 });

    const yearState = { value: 1909 };
    const letters = { value: 1 };
    const film = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'petr', trigger: '.chapter', start: 'top top', end: () => `+=${vh(620)}`,
        pin: '.chapter-stage', scrub: 1.2, invalidateOnRefresh: true,
      },
    });

    // All positions are percentages on one 100-unit chapter timeline.
    film.addLabel('year', 0)
      .to(yearState, { value: 1941, duration: 12, onUpdate: () => setYear(yearState.value) }, 0)
      .addLabel('front', 12)
      .to('.field', { clipPath: 'inset(0% 0% 0% 0%)', duration: 18 }, 12)
      .to('.war-video', { scale: 1.06, y: () => -vh(2), duration: 18 }, 12)
      .to('.war-video', { scale: 1.13, y: () => -vh(5), duration: 56 }, 30)
      .to('.field-shade', { opacity: 1, duration: 12 }, 12)
      .to('.scene-fog', { opacity: .28, duration: 14 }, 12)
      .to('.scene-fog', { x: () => -vw(2), y: () => -vh(4), duration: 74 }, 12)
      .to('.year', { x: () => -vw(mobile ? 2 : 23), y: () => -vh(mobile ? 3 : 1), scale: mobile ? .92 : 1, opacity: .18, duration: 18 }, 12)
      .set('.year', { color: '#c9894a', mixBlendMode: 'overlay' }, 12)
      .to('.front-copy .line-mask > span', { yPercent: 0, duration: 4.5, stagger: 3 }, 18)
      .addLabel('photograph', 30)
      .to('.war-photo', { y: 0, rotationX: 4, rotationZ: -3, opacity: 1, duration: 12, ease: 'power2.out' }, 30)
      .to('.photo-surface', { filter: 'invert(0) sepia(.15) contrast(1) drop-shadow(0px 40px 60px rgba(0,0,0,.55))', duration: 15 }, 30)
      .to('.field-dim', { opacity: .35, duration: 13 }, 30)
      .addLabel('letter', 48)
      .to('.war-photo', { x: () => -vw(mobile ? 22 : 43), y: () => -vh(mobile ? 8 : 6), scale: .7, filter: 'blur(3px)', opacity: .5, duration: 9 }, 48)
      .to('.war-photo figcaption, .front-copy', { opacity: 0, duration: 5 }, 48)
      .to('.triangle', { opacity: 1, x: () => -vw(mobile ? 7 : 23), y: () => vh(mobile ? 18 : 22), rotation: -7, rotationX: 0, duration: 6, ease: 'power2.out' }, 48)
      .to('.triangle', { rotationY: -90, opacity: 0, duration: 3.5, ease: 'power1.in' }, 53)
      .to('.open-letter', { rotationY: 0, opacity: 1, duration: 4, ease: 'power1.out' }, 54)
      .to('.letter-writing p span', { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, stagger: 1.8 }, 57)
      .to('.letter-count', { opacity: 1, y: 0, duration: 3 }, 56)
      .to(letters, { value: 37, duration: 11, onUpdate: () => { $('.count-number').textContent = Math.round(letters.value); } }, 56)
      .addLabel('medal', 68)
      .to('.open-letter', { y: () => vh(80), opacity: 0, rotationX: -12, duration: 9, ease: 'power1.in' }, 68)
      .to('.letter-count', { opacity: 0, y: 30, duration: 5 }, 68)
      .to('.war-photo', { opacity: 0, y: () => -vh(13), duration: 7 }, 68)
      .to('.field', { filter: 'saturate(.7)', duration: 8 }, 68)
      .to('.field-dim', { opacity: .55, duration: 10 }, 68)
      .to('.year', { opacity: 0, duration: 5 }, 68)
      .to('.medal', { y: 0, opacity: 1, duration: 10, ease: 'power2.out' }, 68)
      .to('.medal', { rotation: 5, duration: 6, ease: 'sine.inOut' }, 68)
      .to('.medal', { rotation: -2, duration: 6, ease: 'sine.inOut' }, 74)
      .to('.medal', { rotation: 0, duration: 6, ease: 'sine.out' }, 80)
      .to('.medal-glint', { xPercent: 120, duration: 5 }, 78)
      .to('.medal-copy .line-mask > span', { yPercent: 0, duration: 3.5, stagger: 2 }, 76)
      .addLabel('last-letter', 86)
      .to('.field, .field-shade, .medal, .medal-copy, .chapter-label', { opacity: 0, duration: 3 }, 86)
      .to('.field-dim', { opacity: 0, duration: 3 }, 86)
      .to('.scene-fog', { opacity: .28, duration: 4 }, 86)
      .to('.quote-word', { opacity: 1, filter: 'blur(0px)', duration: 2.4, stagger: .55 }, 87)
      .to('.quote-source', { opacity: .8, duration: 2 }, 92)
      .addLabel('paper', 96)
      .to('.final-fog', { opacity: 1, yPercent: -12, duration: 4 }, 96)
      .to('.last-letter', { opacity: 0, duration: 3 }, 97)
      .to('.paper-wash', { opacity: 1, duration: 3.8 }, 96.2)
      .to('.epilogue', { autoAlpha: 1, duration: 1.8 }, 98.2)
      .addLabel('end', 100);

    window.__film = {
      ready: true,
      reducedMotion: false,
      metrics: () => ['hero', 'petr'].map((id) => {
        const trigger = ScrollTrigger.getById(id);
        return { id, start: trigger.start, end: trigger.end, length: trigger.end - trigger.start, progress: trigger.progress };
      }),
      // Finish the scrub interpolation only when a capture explicitly requests it.
      // The site itself always keeps its 1 / 1.2-second scrub.
      settle: () => {
        intro.progress(1);
        ScrollTrigger.update();
        [hero, film].forEach((timeline) => timeline.scrollTrigger.getTween()?.progress(1));
      },
    };
  });
  ScrollTrigger.refresh();
}

function stopFilm() {
  motionContext?.revert();
  intro?.kill();
  if (ticker) gsap.ticker.remove(ticker);
  lenis?.destroy();
  lenis = undefined;
  window.__lenis = undefined;
  document.documentElement.classList.remove('motion-ready');
}

function staticFilm() {
  setYear(1941);
  $('.count-number').textContent = '37';
  $$('video').forEach((video) => video.pause());
  window.__film = { ready: true, reducedMotion: true, metrics: () => [], settle: () => {} };
}

// Keep autoplay failures quiet: posters provide the exact same composition.
function playVideo(video) {
  if (!reduced.matches && !document.hidden) video.play()?.catch(() => {});
}
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) playVideo(target);
    else target.pause();
  });
}, { rootMargin: '120px' });
$$('video').forEach((video) => videoObserver.observe(video));
document.addEventListener('visibilitychange', () => {
  $$('video').forEach((video) => document.hidden ? video.pause() : playVideo(video));
});

function goTo(target) {
  if (!target) return;
  const chapterTrigger = target.id === 'petr' && ScrollTrigger.getById('petr');
  const position = chapterTrigger ? chapterTrigger.start : target;
  if (lenis) lenis.scrollTo(position, { duration: 1.6 });
  else target.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function openDialog(dialog) {
  lenis?.stop();
  dialog.showModal();
}
$$('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => lenis?.start());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
});
$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$$('[data-open-tree]').forEach((button) => button.addEventListener('click', () => openDialog($('#tree'))));
$('[data-open-prices]').addEventListener('click', () => openDialog($('.prices-dialog')));
$('[data-petr]').addEventListener('click', () => {
  $('#tree').close();
  goTo($('#petr'));
});
$$('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  if (link.hash === '#tree') openDialog($('#tree'));
  else goTo($(link.hash));
}));

// A small repeating noise tile keeps the full-screen overlay inexpensive.
const grain = $('.film-grain');
const context = grain.getContext('2d', { alpha: false });
const tile = document.createElement('canvas');
tile.width = 128;
tile.height = 128;
const tileContext = tile.getContext('2d', { alpha: false });
const noise = tileContext.createImageData(128, 128);
function resizeGrain() {
  grain.width = Math.ceil(window.innerWidth / 2);
  grain.height = Math.ceil(window.innerHeight / 2);
}
function drawGrain() {
  for (let i = 0; i < noise.data.length; i += 4) {
    const shade = Math.random() * 255;
    noise.data[i] = shade;
    noise.data[i + 1] = shade;
    noise.data[i + 2] = shade;
    noise.data[i + 3] = 255;
  }
  tileContext.putImageData(noise, 0, 0);
  context.fillStyle = context.createPattern(tile, 'repeat');
  context.fillRect(0, 0, grain.width, grain.height);
}
resizeGrain();
drawGrain();
let grainTime = 0;
function grainFrame(time) {
  if (!reduced.matches && !document.hidden && time - grainTime >= 1000 / 24) {
    drawGrain();
    grainTime = time - (time - grainTime) % (1000 / 24);
  }
  requestAnimationFrame(grainFrame);
}
requestAnimationFrame(grainFrame);
window.addEventListener('resize', resizeGrain, { passive: true });

await document.fonts.ready;
if (reduced.matches) staticFilm();
else makeFilm();

reduced.addEventListener('change', () => {
  stopFilm();
  if (reduced.matches) staticFilm();
  else { makeFilm(); $$('video').forEach(playVideo); }
});

// Rebuild mobile coordinates when crossing the layout breakpoint, preserving position.
window.matchMedia('(max-width: 767px)').addEventListener('change', () => {
  if (reduced.matches) return;
  const scroll = window.scrollY;
  stopFilm();
  makeFilm();
  intro.progress(1);
  lenis.scrollTo(scroll, { immediate: true });
  ScrollTrigger.update();
});
