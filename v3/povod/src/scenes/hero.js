import { OCCASIONS, V2 } from '../data';
import { gsap, pin, order, $, $$, visual, image, esc } from '../shared';
import { cardsMarkup } from './occasions';

function titleMarkup(k) {
  return V2[k].title.map(word => `<span class="hero-word">${[...word].map(char => `<span class="char-mask"><span>${esc(char)}</span></span>`).join('')}</span>`).join('');
}

export function heroMarkup() {
  return `<section class="hero pinned-stage" id="hero" aria-label="Сайт-подарок к вашему поводу">
    <div class="hero-camera">${order.map((k, i) => `<div class="hero-slide" data-slide="${k}" data-playing="${i === 0}" style="z-index:${i === 0 ? 2 : 0};visibility:${i === 0 ? 'visible' : 'hidden'}">${visual(`slide-${k}`, `v2/scenes/slide-${k}.jpg`, `Герой ${k}`)}</div>`).join('')}</div>
    <div class="hero-shade"></div><div class="curtain-fog" aria-hidden="true"></div>
    <div class="hero-content"><p class="eyebrow">Сайт-подарок. Чувства внутри.</p><h1 class="hero-title" data-key="wedding" aria-label="Свадьба">${titleMarkup('wedding')}</h1>
    <div class="hero-actions"><a href="#request" class="button" data-scroll="request">Собрать подарок</a><a class="text-link" href="#wedding" data-hero-example>Смотреть пример</a></div></div>
    <div class="hero-rail" aria-label="Повод на главном экране"><div class="orbit" aria-hidden="true"><i></i></div>${order.map((k, i) => `<button type="button" class="thumb ${i === 0 ? 'is-active' : ''}" data-slide-button="${i}" aria-label="${OCCASIONS[k].short}" aria-pressed="${i === 0}"><span class="thumb-photo">${image(`v2/thumbs/${k}.jpg`)}</span><span class="thumb-label"><b>${OCCASIONS[k].short}</b><small>${OCCASIONS[k].card}</small></span></button>`).join('')}</div>
    <div class="hero-footer"><p>Ваши люди.<br>Ваши истории.<br>Один особенный подарок.</p><div class="slide-status"><span data-slide-number>01</span><span class="slide-progress"><i></i></span><span>04</span></div><span class="scroll-note">Листайте. Тут начинается хорошее.</span></div>
    <div class="hero-clouds" data-playing="true" aria-hidden="true">${visual('clouds', 'v2/scenes/clouds.jpg', 'Облака screen')}</div>
    <div class="peach-wash" aria-hidden="true"></div>
    <div class="hero-preview" aria-hidden="true" inert><p>Найдётся ваш</p>${cardsMarkup(true)}</div>
  </section>`;
}

export function landingMarkup(k) {
  const o = OCCASIONS[k];
  return `<section class="landing-hero" id="landing" data-playing="true">${visual(`slide-${k}`, `v2/scenes/slide-${k}.jpg`, `Обложка ${o.short}`)}<div class="landing-shade"></div>
    <a class="back-link" href="#home">Все поводы</a><div class="landing-copy"><p class="eyebrow">Сайт-подарок · ${o.short}</p><h1>${o.title}</h1><p>${o.lead}</p><a class="button" href="#story" data-scroll="story">Листать историю</a></div><span class="landing-note">Вымышленная история. Настоящие чувства.</span></section>`;
}

export function mountHero(reduced, videoSync) {
  if (!$('.hero')) return { destroy() {} };
  let active = 0, changing = false, timer, transition, titleTween, paused = false, frozen = false;
  const slides = $$('.hero-slide');
  const buttons = $$('[data-slide-button]');
  const title = $('.hero-title');
  function letters(animate = true) {
    titleTween?.kill();
    if (!reduced && animate) titleTween = gsap.fromTo($$('.char-mask > span', title), { yPercent: 112, rotate: 7 }, { yPercent: 0, rotate: 0, stagger: .025, duration: .9, ease: 'expo.out' });
  }
  function resetTimer() {
    clearTimeout(timer);
    gsap.killTweensOf('.slide-progress i');
    if (!reduced && !paused && !frozen && !document.hidden) {
      gsap.fromTo('.slide-progress i', { scaleX: 0 }, { scaleX: 1, duration: 7.5, ease: 'none' });
      timer = setTimeout(() => change((active + 1) % 4), 7500);
    }
  }
  function change(next) {
    if (next === active || changing) return;
    changing = true;
    const old = slides[active], incoming = slides[next];
    active = next;
    buttons.forEach((b, i) => { b.classList.toggle('is-active', i === next); b.setAttribute('aria-pressed', String(i === next)); });
    gsap.to('.orbit', { y: buttons[next].offsetTop, duration: reduced ? 0 : .9, ease: 'power3.inOut' });
    title.innerHTML = titleMarkup(order[next]); title.dataset.key = order[next];
    title.setAttribute('aria-label', OCCASIONS[order[next]].short);
    $('[data-hero-example]').href = `#${order[next]}`;
    $('[data-slide-number]').textContent = `0${next + 1}`;
    incoming.dataset.playing = 'true';
    gsap.set(incoming, { visibility: 'visible', zIndex: 3, clipPath: reduced ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)' });
    letters();
    transition = gsap.timeline({ onComplete() {
      gsap.set(old, { visibility: 'hidden', zIndex: 0 }); old.dataset.playing = 'false';
      gsap.set(incoming, { zIndex: 2 }); changing = false; resetTimer(); videoSync();
    } });
    transition.to(incoming, { clipPath: 'inset(0 0 0 0%)', duration: reduced ? 0 : 1.2, ease: 'power3.inOut' }, 0)
      .fromTo('.curtain-fog', { xPercent: 110, opacity: 0 }, { xPercent: -110, opacity: .85, duration: reduced ? 0 : 1.25, ease: 'power2.inOut' }, 0)
      .to('.curtain-fog', { opacity: 0, duration: .25 }, reduced ? 0 : .95);
  }
  const click = e => { const b = e.target.closest('[data-slide-button]'); if (b) change(+b.dataset.slideButton); };
  $('.hero-rail').addEventListener('click', click);
  const parallax = e => {
    if (reduced || paused) return;
    gsap.to('.hero-slide .visual', { xPercent: (e.clientX / innerWidth - .5) * 1.2, yPercent: (e.clientY / innerHeight - .5) * 1.2, duration: 1.2, ease: 'power2.out', overwrite: true });
  };
  $('.hero').addEventListener('pointermove', parallax);
  const visibility = () => resetTimer();
  document.addEventListener('visibilitychange', visibility);
  letters(); resetTimer();
  let tl;
  if (!reduced) {
    gsap.set('.hero-clouds', { yPercent: 60, scale: 1.1, opacity: .6 });
    gsap.set('.peach-wash', { opacity: 0 });
    gsap.set('.hero-preview', { autoAlpha: 0, y: 100 });
    tl = pin('hero', '.hero', 120);
    tl.to('.hero-camera', { scale: 1.12, filter: 'blur(6px)', duration: 100 }, 0)
      .to('.hero-content, .hero-rail, .hero-footer', { y: -65, autoAlpha: 0, duration: 28 }, 8)
      .to('.hero-clouds', { yPercent: -25, scale: 1.75, opacity: 1, duration: 65 }, 10)
      .to('.peach-wash', { opacity: 1, duration: 40 }, 45)
      .to('.hero-preview', { autoAlpha: 1, y: 0, duration: 26 }, 66)
      .to('.hero-preview .occasion-card', { y: i => -i * 8, rotation: i => (i - 2) * 4, stagger: 2, duration: 22 }, 70)
      .to({}, { duration: 4 }, 96);
    // Stop automatic changes as soon as the reader enters the cloud transition.
    tl.eventCallback('onUpdate', () => {
      const next = tl.progress() > .04;
      if (next !== paused) { paused = next; resetTimer(); }
      $('.hero').dataset.playing = String(tl.progress() < .94);
    });
  }
  return { timeline: tl, change, freeze() { frozen = true; clearTimeout(timer); gsap.killTweensOf('.slide-progress i'); titleTween?.progress(1); }, destroy() { clearTimeout(timer); transition?.kill(); titleTween?.kill(); $('.hero')?.removeEventListener('pointermove', parallax); document.removeEventListener('visibilitychange', visibility); } };
}
