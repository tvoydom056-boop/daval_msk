import { OCCASIONS, HUB } from '../data';
import { gsap, pin, order, $, $$, visual } from '../shared';

export function cardsMarkup(preview = false) {
  return `<div class="card-deck ${preview ? 'preview-deck' : ''}" ${preview ? '' : 'data-lenis-prevent-horizontal'}>${order.map((k, i) => `<a class="occasion-card" href="#${k}" data-route="${k}" data-hover-video data-playing="${!preview}" style="--card-index:${i}">
    <div class="card-lift">${visual(preview ? null : `slide-${k}`, `v2/scenes/slide-${k}.jpg`, `Карточка ${OCCASIONS[k].short}`)}
    <div class="card-meta"><h3>${OCCASIONS[k].short}</h3><span>${OCCASIONS[k].from}</span></div></div></a>`).join('')}
    <a href="#request" data-scroll="request" data-own class="occasion-card own-card"><div class="card-lift"><span class="own-star" aria-hidden="true">✳</span><h3>Свой<br>повод</h3><p>${HUB.other}</p></div></a></div>`;
}

export function occasionsMarkup() {
  return `<section id="occasions" class="occasions pinned-stage" aria-label="Выберите повод">
    <div class="occasion-heading"><p class="eyebrow">Для тех, кто вам дорог</p><h2>Выберите повод</h2><span>У каждой истории свой особенный день</span></div>
    <div class="deck-halo" aria-hidden="true"></div>${cardsMarkup()}
    <p class="occasion-swipe">Листайте карточки. Здесь найдётся ваш повод.</p>
    <p class="scene-foot">Пять поводов. Бесконечно много ваших историй.</p>
  </section>`;
}

export function cardGeometry(width, height) {
  const mobile = width < 768;
  const w = width * (mobile ? .64 : .17);
  const h = w * 1.4;
  return { w, h, targets: Array.from({ length: 5 }, (_, i) => mobile
    ? { x: width * .18 + i * (w + 18), y: 0 }
    : { x: (i - 2) * (w + 18) - w / 2, y: -h / 2 }) };
}

export function mountOccasions(reduced) {
  if (reduced || !$('.occasions')) return null;
  const deck = $('.occasions .card-deck');
  const cards = $$('.occasion-card', deck);
  const heading = $('.occasion-heading');
  const get = () => cardGeometry(innerWidth, innerHeight);
  if (innerWidth < 768) {
    // Native overflow provides touch momentum and scroll-snap without fighting
    // the vertical story scrub. Only the desktop deck is positioned by GSAP.
    const tl = pin('occasions', '.occasions', 140);
    tl.fromTo(heading, { y: 15, opacity: 1 }, { y: 0, opacity: 1, duration: 20 }, 0)
      .to({}, { duration: 80 }, 20);
    return tl;
  }
  gsap.set(cards, { x: () => -get().w / 2, y: () => -get().h / 2 + innerHeight * .15, rotation: i => [-8, -4, 0, 4, 8][i], scale: .78, autoAlpha: 1 });
  gsap.set(heading, { y: 20, opacity: 1 });
  const tl = pin('occasions', '.occasions', 140);
  tl.to(heading, { y: 0, opacity: 1, duration: 18 }, 0)
    .to(cards, { autoAlpha: 1, stagger: 3, duration: 12 }, 2)
    .to(cards, { x: i => get().targets[i].x, y: i => get().targets[i].y, rotation: 0, scale: 1, stagger: 4, duration: 48, ease: 'power2.inOut' }, 10)
    .to('.deck-halo', { scale: 1.6, opacity: .45, duration: 70 }, 5)
    .fromTo('.occasions .scene-foot', { opacity: 0 }, { opacity: 1, duration: 15 }, 75)
    .to({}, { duration: 10 }, 90);
  return tl;
}
