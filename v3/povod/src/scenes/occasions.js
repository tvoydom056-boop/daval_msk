import { OCCASIONS } from '../data';
import { order, image, esc } from '../dom';

export function cardsMarkup() {
  return `<div class="occasion-grid">${order.map(key => {
    const o = OCCASIONS[key];
    return `<a class="occasion-card" href="#${key}" data-route="${key}"><div class="occasion-photo" data-slot="Пример подарка ${esc(o.short)}">${image(`v2/scenes/slide-${key}.jpg`, `Демонстрационный подарок: ${o.short}`, 'loading="lazy" width="800" height="600" sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 900px) calc(50vw - 36px), (max-width: 1100px) calc(25vw - 32px), 280px"')}</div><div class="occasion-meta"><h3>${esc(o.short)}</h3><p>${esc(o.card)}</p><span>${esc(o.from)}</span></div></a>`;
  }).join('')}</div>`;
}

export function occasionsMarkup() {
  return `<section id="occasions" class="section occasions-section"><div class="wrap"><div class="section-heading"><h2>Для какого повода<br>выбираете подарок?</h2><p class="lead">Посмотрите, какую историю можно собрать к вашему дню.</p></div>${cardsMarkup()}<div class="own-occasion"><div><h3>Есть свой повод?</h3><p>Выпускной, рождение ребёнка или просто «спасибо». Обсудим вашу идею.</p></div><a class="text-link" href="#request" data-scroll="request" data-own>Рассказать о поводе</a></div></div></section>`;
}
