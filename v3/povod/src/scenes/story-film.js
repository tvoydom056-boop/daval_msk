import { OCCASIONS } from '../data.js';
import { gsap, ScrollTrigger, pin, $, $$, media, image, lines, esc } from '../shared.js';
import { getStoryScenes, captionLines } from './story-config.js';

const ring = `<svg viewBox="0 0 150 180" fill="none" aria-hidden="true"><defs><linearGradient id="film-gold" x2="1" y2="1"><stop stop-color="#fff6ca"/><stop offset=".4" stop-color="#d69c48"/><stop offset=".65" stop-color="#fff4ad"/><stop offset="1" stop-color="#af7528"/></linearGradient></defs><circle cx="75" cy="105" r="49" stroke="url(#film-gold)" stroke-width="8"/><path d="m52 35 10-18h26l10 18-23 26Z" stroke="#fff2d0" stroke-width="3" fill="#fff9e245"/><path d="M52 35h46M62 17l13 44 13-44" stroke="#fff2d0"/><path class="film-ring-spark" d="M111 54v28m-14-14h28" stroke="white" stroke-width="2"/></svg>`;
const keys = `<svg viewBox="0 0 160 190" fill="none" aria-hidden="true"><ellipse cx="80" cy="38" rx="38" ry="28" stroke="#e0c595" stroke-width="5"/><g stroke="#f7e4b8" stroke-width="8" stroke-linejoin="round"><path d="M64 58v103h22v-18H74v-16h12v-16H64"/><circle cx="63" cy="72" r="16"/><path d="m103 52 26 83-19 6-6-18 11-3-5-16-12 4-5-16"/><circle cx="99" cy="67" r="15"/></g></svg>`;
const pawShape = `<ellipse cx="0" cy=".014" rx=".034" ry=".027"/><ellipse cx="-.035" cy="-.017" rx=".013" ry=".019"/><ellipse cx="-.013" cy="-.04" rx=".013" ry=".019"/><ellipse cx=".015" cy="-.038" rx=".013" ry=".019"/><ellipse cx=".038" cy="-.012" rx=".012" ry=".017"/>`;
const paws = Array.from({ length: 8 }, (_, i) => ({ x: .08 + i * .12, y: .86 - i * .104 }));
const clamp = n => Math.min(1, Math.max(0, n));
const pad = n => String(n).padStart(2, '0');

function composition(name, video, extra = '') {
  return `<div class="film-composite ${extra}" data-composite="${name}" data-slot="2.5D ${name}">
    <div class="depth-bg"><div class="depth-pointer">${image(`story/${name}-bg.jpg`)}${video ? `<video muted loop playsinline preload="none" data-src="${media(`v2/video/${video}.mp4`)}" aria-hidden="true"></video>` : ''}</div></div>
    <div class="depth-fg"><div class="depth-pointer">${image(`story/${name}-fg.png`, '', 'class="person-cutout"')}<div class="depth-atmosphere" aria-hidden="true"></div></div></div></div>`;
}

function photoComposition(s) {
  return `<div class="film-composite photo-composite" data-slot="Фото главы ${esc(s.label)}"><div class="depth-bg"><div class="depth-pointer">${image(s.image, s.label)}</div></div><div class="depth-fg"><div class="depth-pointer"><div class="photo-edge"></div><div class="depth-atmosphere"></div></div></div></div>`;
}

function letterMarkup(key) {
  const letter = OCCASIONS[key].gift.sections.find(s => s.type === 'letter');
  return `<div class="story-letter"><div class="paper-fold"></div><span class="paper-label">Сохранить самое важное</span><div class="letter-writing">${lines(letter.text, innerWidth < 768 ? 29 : 43).map(t => `<p><span>${esc(t)}</span></p>`).join('')}<p class="letter-sign"><span>${letter.sign}</span></p></div></div>`;
}

function sceneContent(s, wedding) {
  if (!wedding) return photoComposition(s);
  if (s.id === 'before') return `<div class="split-half half-him">${composition('before-him')}<span class="city-label">Питер. Он.</span></div><div class="split-half half-her">${composition('before-her')}<span class="city-label">Казань. Она.</span></div><div class="split-seam"></div>`;
  if (s.id === 'puppy') return `${composition('puppy')}<div class="today-memory" data-playing="false">${composition('story-today', 'story-today')}</div>`;
  return composition(s.media, s.video);
}

function sceneProps(s) {
  if (s.id === 'meet') return `<div class="film-handwriting">Как всё началось</div><div class="film-clock" aria-label="Стрелка отматывает 20 минут"><div class="clock-face"><i class="clock-hour"></i><i class="clock-minute"></i><b></b></div><span>Ну почти вовремя.</span></div>`;
  if (s.id === 'rain') return '<div class="neon-reflection" aria-hidden="true"></div>';
  if (s.id === 'quarrel') return '<div class="film-sunbeam" aria-hidden="true"></div>';
  if (s.id === 'home') return `<div class="film-keys">${keys}</div>`;
  if (s.id === 'proposal') return `<div class="film-ring">${ring}</div>`;
  return '';
}

export function storyMarkup(key) {
  const scenes = getStoryScenes(key), wedding = key === 'wedding';
  return `<section id="story" class="story film-story pinned-stage ${wedding ? 'wedding-film' : 'occasion-film'}" data-key="${key}" data-scene-count="${scenes.length}" aria-label="История: ${OCCASIONS[key].demoTitle}">
    <svg class="film-mask-defs" width="0" height="0" aria-hidden="true"><defs><clipPath id="film-keyhole" clipPathUnits="objectBoundingBox"><path data-keyhole-path d="M.5 .23a.11 .11 0 1 1-.07 .195L.36 .70h.28l-.07-.275A.11 .11 0 0 1 .5 .23Z" transform="translate(.5 .45) scale(0) translate(-.5 -.45)"/></clipPath><clipPath id="film-paw-mask" clipPathUnits="objectBoundingBox">${paws.map(p => `<g data-paw-mask transform="translate(${p.x} ${p.y}) scale(0)">${pawShape}</g>`).join('')}</clipPath></defs></svg>
    ${scenes.map((s, i) => `<article class="film-scene story-panel film-${s.id}" data-scene="${i}" data-transition="${s.transition}" data-playing="false" style="--scene-bg:${s.bg};--scene-accent:${s.accent};--scene-ink:${s.ink};z-index:${i + 1}" aria-label="${i + 1}. ${esc(s.label)}">
      <div class="film-shot">${sceneContent(s, wedding)}</div><div class="film-grade" aria-hidden="true"></div>${sceneProps(s)}
      <div class="film-caption position-${s.position} mobile-${s.mobile}"><small>${s.year} · ${esc(s.label)}</small><p>${captionLines(s.text, innerWidth < 768).map(line => `<span class="line-mask"><span>${esc(line)}</span></span>`).join('')}</p></div>
      <span class="static-scene-number">${pad(i + 1)} · ${s.year}</span></article>`).join('')}
    <div class="film-ticket" aria-hidden="true"><div class="film-ticket-main"><small>Два места в одной истории</small><b>Москва <span>-></span> Море</b><p>Пассажиров: двое. Планов: никаких.</p><div class="barcode"></div></div><div class="film-ticket-stub"><small>ТУДА</small><b>02</b><span>И вместе</span></div></div>
    <div class="film-flash" aria-hidden="true"></div><div class="film-blackout" aria-hidden="true"></div>
    <svg class="film-paw-marks" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">${paws.map(p => `<g data-paw-mark transform="translate(${p.x} ${p.y}) scale(.6)">${pawShape}</g>`).join('')}</svg>
    <canvas class="film-effects" aria-hidden="true" data-petals="72"></canvas>
    <div class="film-letter-stage">${letterMarkup(key)}<h2 class="gift-transition">А это - ваш подарок<span>Вся история. В одной ссылке.</span></h2></div>
    <div class="film-ui"><div class="film-progress" aria-label="Сцены истории"><div class="film-progress-track"><i></i></div>${scenes.map((s, i) => `<button type="button" data-film-dot="${i}" aria-label="Сцена ${i + 1}: ${esc(s.label)}"><span></span></button>`).join('')}</div><div class="film-counter"><div class="film-counter-window"><div class="film-counter-track">${scenes.map((s, i) => `<span>${pad(i + 1)}<b> · ${s.year}</b></span>`).join('')}</div></div><small>${OCCASIONS[key].demoTitle}</small></div><span class="film-scroll-label">Листайте вашу историю</span></div>
  </section>`;
}

function themeValues(s) {
  return { '--film-bg': s.bg, '--film-accent': s.accent, '--film-ink': s.ink };
}

export function mountStory(key, reduced) {
  const stage = $('.film-story');
  if (!stage) return { destroy() {} };
  const scenes = getStoryScenes(key), panels = $$('.film-scene', stage), wedding = key === 'wedding';
  const mobile = innerWidth < 768, segment = 100 / scenes.length;
  const body = document.body;
  body.classList.add('story-route');
  Object.entries(themeValues(scenes[0])).forEach(([name, value]) => body.style.setProperty(name, value));
  let active = 0, totalProgress = 0, observer, pointerTween;
  const cleanups = [];

  // A clean background + cutout is the poster composition. Once a video has
  // decoded, the complete video replaces both photographs atomically. Only
  // light, effects and props remain in the foreground, so people never double.
  $$('video', stage).forEach(video => {
    const composite = video.closest('.film-composite');
    const live = () => composite.classList.add('video-live');
    const error = () => composite.classList.remove('video-live');
    video.addEventListener('playing', live); video.addEventListener('error', error);
    cleanups.push(() => { video.removeEventListener('playing', live); video.removeEventListener('error', error); });
  });

  function updateActive(index) {
    active = Math.min(scenes.length - 1, Math.max(0, index));
    stage.dataset.activeScene = active;
    $$('[data-film-dot]', stage).forEach((dot, i) => { dot.classList.toggle('is-current', i === active); dot.setAttribute('aria-current', i === active ? 'step' : 'false'); });
  }

  if (reduced) {
    const visible = new Map();
    observer = new IntersectionObserver(entries => {
      entries.forEach(e => visible.set(e.target, e.intersectionRatio));
      const current = [...visible].sort((a, b) => b[1] - a[1])[0];
      body.classList.toggle('story-active', Boolean(current && current[1] > .05));
      if (current && current[1] > .05) {
        const i = panels.indexOf(current[0]); updateActive(i);
        Object.entries(themeValues(scenes[i])).forEach(([name, value]) => body.style.setProperty(name, value));
      }
    }, { threshold: [0, .1, .3, .5, .7, .9] });
    panels.forEach(panel => observer.observe(panel));
    updateActive(0);
    return { destroy() { observer.disconnect(); cleanups.forEach(fn => fn()); resetTheme(); } };
  }

  gsap.set(panels, { autoAlpha: 0 });
  gsap.set(panels[0], { autoAlpha: 1 });
  gsap.set('.film-caption', { autoAlpha: 0, y: 22 });
  gsap.set('.film-caption .line-mask>span', { yPercent: 115 });
  gsap.set('.film-letter-stage', { autoAlpha: 0 });
  gsap.set('.film-letter-stage .story-letter', { yPercent: 110, rotation: -7 });
  gsap.set('.film-letter-stage .letter-writing p>span', { clipPath: 'inset(0 100% 0 0)' });
  gsap.set('.film-letter-stage .gift-transition', { autoAlpha: 0, y: 25 });
  gsap.set('.film-ticket,.film-flash,.film-blackout,.film-keys,.film-ring,.film-clock,.film-handwriting,.film-paw-marks', { autoAlpha: 0 });
  gsap.set('.today-memory', { autoAlpha: 0 });
  gsap.set($$('[data-paw-mark]', stage), { opacity: 0 });
  const timeline = pin('story', stage, wedding ? 1100 : 600, {
    onToggle: self => body.classList.toggle('story-active', self.isActive),
  });
  timeline.to('.film-progress-track i', { scaleX: 1, duration: 100 }, 0);

  scenes.forEach((s, i) => {
    const panel = panels[i], shot = $('.film-shot', panel), start = i * segment;
    const entry = Math.max(0, start - .7), entrance = i ? 3 : 2.2;
    const captionAt = start + (wedding ? 3.2 : 4.2);
    const captionEnd = start + segment - (i === scenes.length - 1 ? 5.1 : 1);
    if (i) {
      timeline.set(panel, { autoAlpha: 1 }, entry);
      timeline.to(body, { ...themeValues(s), duration: 3.2, ease: 'sine.inOut' }, entry);
      timeline.to('.film-counter-track', { yPercent: -i * 100 / scenes.length, duration: .8, ease: 'power2.inOut' }, start + .5);
      timeline.fromTo('.film-counter-window', { rotationX: -78, opacity: .3 }, { rotationX: 0, opacity: 1, duration: 1.1, immediateRender: false }, start + .5);
      timeline.set(panels[i - 1], { autoAlpha: 0 }, entry + entrance + .15);
    }
    const direction = i % 2 ? -1 : 1;
    timeline.fromTo($$('.depth-bg', panel), { scale: 1, xPercent: -direction, yPercent: 0 }, { scale: 1.06, xPercent: direction, yPercent: -2, duration: segment, immediateRender: false }, start)
      .fromTo($$('.depth-fg', panel), { scale: 1, xPercent: direction * 2.5, yPercent: 0 }, { scale: 1.12, xPercent: -direction * 2.5, yPercent: 5, duration: segment, immediateRender: false }, start)
      .to($('.film-caption', panel), { autoAlpha: 1, y: 0, duration: .8 }, captionAt)
      .to($$('.film-caption .line-mask>span', panel), { yPercent: 0, duration: .65, stagger: .45 }, captionAt + .25)
      .to($('.film-caption', panel), { autoAlpha: 0, y: -15, duration: .65 }, Math.max(captionAt + 1.6, captionEnd));

    switch (s.transition) {
      case 'diagonal': {
        gsap.set('.split-half', { xPercent: 0 });
        const seam = { value: 0 };
        timeline.to(seam, { value: 1, duration: 10, onUpdate: () => { $('.split-seam', stage).style.translate = `${Math.sin(seam.value * 137) * 2}px 0`; } }, 0);
        break;
      }
      case 'polaroid': {
        gsap.set(panel, { backgroundColor: 'transparent' });
        timeline.to(panel, { backgroundColor: s.bg, duration: .7 }, entry + entrance - .7);
        if (wedding) {
          timeline.to('.half-him', { xPercent: 24, duration: 2.5, ease: 'power2.inOut' }, entry)
            .to('.half-her', { xPercent: -24, duration: 2.5, ease: 'power2.inOut' }, entry)
            .to('.split-seam', { opacity: 0, duration: 1 }, entry);
        }
        timeline.fromTo(shot, { top: mobile ? '29%' : '19%', right: mobile ? '12%' : '26%', bottom: mobile ? '26%' : '16%', left: mobile ? '12%' : '26%', '--mat': '14px', '--mat-bottom': '44px', filter: 'grayscale(1) brightness(1.6)', rotation: -5, opacity: 0 }, { top: mobile ? '27%' : '0%', right: '0%', bottom: mobile ? '23%' : '0%', left: '0%', '--mat': '0px', '--mat-bottom': '0px', filter: 'grayscale(0) brightness(1)', rotation: 0, opacity: 1, duration: entrance, ease: 'power2.inOut', immediateRender: false }, entry);
        if (wedding) {
          timeline.fromTo('.film-handwriting', { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: 1.7, immediateRender: false }, start)
            .to('.film-handwriting', { autoAlpha: 0, duration: .8 }, start + 3.1)
            .fromTo('.film-clock', { scale: .6, rotation: 16, autoAlpha: 0 }, { scale: 1, rotation: -8, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.5)', immediateRender: false }, start + 2.7)
            .to('.film-clock .clock-minute', { rotation: -120, duration: 4.5 }, start + 3)
            .to('.film-clock', { autoAlpha: 0, y: -20, duration: .6 }, start + 8.4);
        }
        break;
      }
      case 'rain': {
        gsap.set(panel, { clipPath: 'polygon(0% 0%,100% 0%,100% 0%,0% 0%)' });
        const rain = { value: 0 };
        timeline.to(rain, { value: 1, duration: entrance, onUpdate: () => {
          const points = ['0% 0%', '100% 0%'];
          for (let c = 10; c >= 0; c--) {
            const y = clamp((rain.value - Math.sin(c * 1.2) * .09) * 1.3) * 100;
            points.push(`${c * 10}% ${y}%`);
          }
          panel.style.clipPath = `polygon(${points.join(',')})`;
        } }, entry);
        break;
      }
      case 'flash':
        timeline.fromTo('.film-flash', { autoAlpha: 0, xPercent: -60 }, { autoAlpha: 1, xPercent: 0, duration: .7, immediateRender: false }, entry)
          .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: .1, immediateRender: false }, entry + .65)
          .to('.film-flash', { autoAlpha: 0, xPercent: 80, duration: 2.2 }, entry + .8);
        break;
      case 'ticket':
        timeline.fromTo(panel, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: entrance, immediateRender: false }, entry)
          .fromTo('.film-ticket', { xPercent: -50, yPercent: -50, x: () => innerWidth, y: () => -innerHeight * .4, rotation: 28, autoAlpha: 1 }, { x: 0, y: 0, rotation: -5, duration: 1.4, ease: 'power3.out', immediateRender: false }, entry - 1)
          .fromTo('.film-ticket-stub', { x: 0, y: 0, rotation: 0 }, { x: 80, y: () => innerHeight * .55, rotation: 40, duration: 1.5, ease: 'power2.in', immediateRender: false }, entry + .5)
          .to('.film-ticket', { x: () => -innerWidth, autoAlpha: 0, rotation: -20, duration: 1.5 }, entry + 1.6);
        break;
      case 'sunrise':
        timeline.to($('.film-shot', panels[i - 1]), { filter: 'grayscale(1) brightness(.65)', duration: 1 }, entry - .8)
          .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 2, immediateRender: false }, entry)
          .fromTo(shot, { filter: 'grayscale(1) brightness(.7)' }, { filter: 'grayscale(1) brightness(.7)', duration: 2, immediateRender: false }, entry)
          .to(shot, { filter: 'grayscale(0) brightness(1.04)', duration: 3 }, start + 4.5)
          .fromTo('.film-sunbeam', { xPercent: -100, opacity: 0 }, { xPercent: 65, opacity: .7, duration: 5, immediateRender: false }, start + 3)
          .to(body, { '--film-bg': s.warm, '--film-accent': '#b66f36', '--film-ink': '#34281f', duration: 3 }, start + 5)
          .to(panel, { '--scene-bg': s.warm, '--scene-ink': '#34281f', duration: 3 }, start + 5);
        break;
      case 'keyhole': {
        // Clip the home photograph itself. The transparent scene keeps the
        // preceding photograph visible outside the opening, including on rewind.
        gsap.set(panel, { backgroundColor: 'transparent', clipPath: 'none' });
        gsap.set($('.film-grade', panel), { opacity: 0 });
        const shape = progress => {
          if (progress >= .999) return 'none';
          const size = Math.min(innerWidth, innerHeight);
          const scale = progress * progress * 28;
          const angle = progress * Math.PI / 7;
          const points = [];
          for (let n = 0; n <= 36; n++) {
            const a = (60 - n / 36 * 300) * Math.PI / 180;
            points.push([Math.cos(a) * size * .11, -size * .1 + Math.sin(a) * size * .11]);
          }
          points.push([-size * .14, size * .24], [size * .14, size * .24]);
          return `polygon(${points.map(([x, y]) => `${innerWidth / 2 + (x * Math.cos(angle) - y * Math.sin(angle)) * scale}px ${innerHeight / 2 + (x * Math.sin(angle) + y * Math.cos(angle)) * scale}px`).join(',')})`;
        };
        gsap.set(shot, { clipPath: shape(0) });
        const keyhole = { value: 0 };
        timeline.to(keyhole, { value: 1, duration: entrance, ease: 'power3.in', onUpdate: () => { shot.style.clipPath = shape(keyhole.value); } }, entry)
          .to($('.film-grade', panel), { opacity: 1, duration: .5 }, entry + entrance)
          .to(panel, { backgroundColor: s.bg, duration: .01 }, entry + entrance)
          .fromTo('.film-keys', { autoAlpha: 1, y: () => -innerHeight * .8, rotation: -40 }, { y: 0, rotation: 25, duration: 1.4, ease: 'bounce.out', immediateRender: false }, entry - .7)
          .to('.film-keys', { rotation: -60, scale: .7, autoAlpha: 0, duration: 1.7 }, entry + 1);
        break;
      }
      case 'paws': {
        gsap.set(panel, { clipPath: 'url(#film-paw-mask)' });
        const wipe = { value: 0 };
        timeline.to(wipe, { value: 1, duration: entrance, onUpdate: () => {
          panel.style.clipPath = wipe.value > .999 ? 'none' : 'url(#film-paw-mask)';
          $$('[data-paw-mask]', stage).forEach((g, n) => {
            const scale = clamp((wipe.value - n * .075) / .3) * (1 + Math.max(0, wipe.value - .56) * 52);
            g.setAttribute('transform', `translate(${paws[n].x} ${paws[n].y}) rotate(-35) scale(${scale})`);
          });
        } }, entry)
          .fromTo('.film-paw-marks', { autoAlpha: 0 }, { autoAlpha: .8, duration: 1, immediateRender: false }, entry)
          .to($$('[data-paw-mark]', stage), { opacity: 1, duration: .4, stagger: .22 }, entry)
          .to($$('[data-paw-mark]', stage), { opacity: 0, duration: .7, stagger: .16 }, entry + 1.8)
          .to('.film-paw-marks', { autoAlpha: 0, duration: 1.2 }, entry + 2)
          .to('.today-memory', { autoAlpha: 1, duration: 2 }, start + 5);
        break;
      }
      case 'blackout':
        timeline.fromTo('.film-blackout', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, immediateRender: false }, entry - .7)
          .to('.film-blackout', { autoAlpha: 0, duration: 2.2 }, entry + 1)
          .fromTo('.film-ring', { y: () => innerHeight * .6, rotation: -28, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 3, ease: 'power2.out', immediateRender: false }, start + 2)
          .fromTo('.film-ring-spark', { opacity: .1 }, { opacity: 1, duration: .6, repeat: 3, yoyo: true, immediateRender: false }, start + 5.3)
          .to('.film-ring', { y: -90, autoAlpha: 0, duration: 1 }, start + 8);
        break;
      case 'petals':
      case 'aperture':
        timeline.fromTo(panel, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(76% at 50% 50%)', duration: entrance, ease: 'power2.inOut', immediateRender: false }, entry);
        break;
      case 'curtain':
        timeline.fromTo(panel, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: entrance, ease: 'power3.inOut', immediateRender: false }, entry);
        break;
      case 'page':
        timeline.fromTo(shot, { rotationY: -70, transformOrigin: 'left center', opacity: 0 }, { rotationY: 0, opacity: 1, duration: entrance, ease: 'power2.out', immediateRender: false }, entry);
        break;
    }
  });

  const letterAt = wedding ? 95.2 : 92;
  const writing = $$('.film-letter-stage .letter-writing p>span', stage);
  timeline.to('.film-letter-stage', { autoAlpha: 1, duration: .9 }, letterAt)
    .to('.film-letter-stage .story-letter', { yPercent: 0, rotation: mobile ? -2 : -3, duration: 1.2, ease: 'power2.out' }, letterAt)
    .to(writing, { clipPath: 'inset(0 0% 0 0)', duration: .35, stagger: (wedding ? 2.5 : 4) / Math.max(1, writing.length - 1) }, letterAt + 1)
    .to('.film-letter-stage .story-letter', { y: -35, scale: 1, duration: .8 }, 98.7)
    .to('.film-letter-stage .gift-transition', { autoAlpha: 1, y: 0, duration: 1 }, 99)
    .to({}, { duration: .01 }, 99.99);

  const pointer = { x: 0, y: 0 };
  function paintPointer() {
    $$('.depth-bg .depth-pointer', panels[active]).forEach(el => { el.style.transform = `translate3d(${pointer.x * .35}%,${pointer.y * .35}%,0)`; });
    $$('.depth-fg .depth-pointer', panels[active]).forEach(el => { el.style.transform = `translate3d(${-pointer.x * .65}%,${-pointer.y * .65}%,0)`; });
  }
  const move = e => {
    pointerTween?.kill();
    pointerTween = gsap.to(pointer, { x: (e.clientX / innerWidth - .5) * 1.2, y: (e.clientY / innerHeight - .5) * 1.2, duration: .8, onUpdate: paintPointer });
  };
  const leave = () => { pointerTween?.kill(); pointerTween = gsap.to(pointer, { x: 0, y: 0, duration: 1, onUpdate: paintPointer }); };
  stage.addEventListener('pointermove', move); stage.addEventListener('pointerleave', leave);
  const dots = e => {
    const dot = e.target.closest('[data-film-dot]');
    if (!dot) return;
    const p = (+dot.dataset.filmDot * segment + 3.5) / 100, st = timeline.scrollTrigger;
    window.__lenis?.scrollTo(st.start + (st.end - st.start) * p, { duration: 1.1 });
  };
  $('.film-progress', stage).addEventListener('click', dots);

  function sync() {
    totalProgress = timeline.progress();
    const time = totalProgress * 100;
    updateActive(Math.floor(time / segment));
    panels.forEach((panel, i) => {
      const on = time >= Math.max(0, i * segment - .7) && time < (i + 1) * segment + 2.5 && time < letterAt + .5;
      if (panel.dataset.playing !== String(on)) panel.dataset.playing = String(on);
    });
    const today = $('.today-memory', stage);
    if (today) today.dataset.playing = String(time >= 75 && time < 82.5);
    paintPointer();
    drawEffects(performance.now() / 1000);
  }
  const canvas = $('.film-effects', stage), ctx = canvas.getContext('2d');
  const seeded = i => { const value = Math.sin(i * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };
  const particles = Array.from({ length: 100 }, (_, i) => ({ x: seeded(i), y: seeded(i + 123), size: 2 + seeded(i + 37) * 5, phase: seeded(i + 71) * Math.PI * 2 }));
  function drawEffects(t) {
    if (!ctx || !wedding || document.hidden) return;
    const time = totalProgress * 100;
    const inRange = (a, b) => time >= a && time < b;
    const effect = inRange(19.3, 30.4) ? 'rain' : inRange(79.3, 90) ? 'city' : inRange(89.3, 95.5) ? 'petals' : '';
    if (!effect && !canvas.dataset.effect) return;
    if (canvas.width !== innerWidth || canvas.height !== innerHeight) { canvas.width = innerWidth; canvas.height = innerHeight; }
    ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.dataset.effect = effect;
    if (!effect) return;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    if (effect === 'rain') {
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#f3c7e1';
      particles.forEach((p, i) => {
        const y = ((p.y + t * (.13 + i % 3 * .04) + time * .013) % 1) * h;
        const x = p.x * w + Math.sin(y / h * 4 + p.phase) * 6;
        ctx.globalAlpha = .13 + p.size * .035; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + p.size * 6); ctx.stroke();
        if (i % 7 === 0) { ctx.beginPath(); ctx.ellipse(x, y, p.size * .5, p.size * 1.5, -.16, 0, Math.PI * 2); ctx.stroke(); }
      });
    } else if (effect === 'city') {
      const lit = Math.floor(clamp((time - 80) / 5) * 72);
      particles.slice(0, lit).forEach((p, i) => {
        ctx.globalAlpha = .25 + .65 * (.5 + Math.sin(t * 1.5 + p.phase) * .5);
        ctx.fillStyle = i % 4 ? '#ffd994' : '#fff5dc'; ctx.shadowColor = '#ffc470'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(p.x * w, (.3 + p.y * .58) * h, p.size * .42, 0, Math.PI * 2); ctx.fill();
      });
    } else {
      particles.slice(0, 72).forEach((p, i) => {
        const x = (p.x + Math.sin(t * .35 + p.phase) * .04) * w;
        const y = ((p.y + t * .045 + (time - 89.3) * .09) % 1) * h;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * (.4 + p.size * .08) + p.phase); ctx.scale(Math.cos(t + p.phase) * .65 + .8, 1);
        ctx.globalAlpha = .75; ctx.fillStyle = ['#fff5e7','#f6a899','#ffd7bd','#f9e2d7'][i % 4];
        ctx.beginPath(); ctx.ellipse(0, 0, p.size * .8, p.size * 1.65, .45, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
    }
    ctx.restore();
  }
  timeline.eventCallback('onUpdate', sync);
  gsap.ticker.add(drawEffects);
  sync();
  return { timeline, scenes, settle: sync, destroy() {
    observer?.disconnect(); pointerTween?.kill(); gsap.ticker.remove(drawEffects);
    stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave);
    $('.film-progress', stage).removeEventListener('click', dots);
    cleanups.forEach(fn => fn()); resetTheme();
  } };

  function resetTheme() {
    body.classList.remove('story-active', 'story-route');
    ['--film-bg','--film-accent','--film-ink'].forEach(name => body.style.removeProperty(name));
  }
}
