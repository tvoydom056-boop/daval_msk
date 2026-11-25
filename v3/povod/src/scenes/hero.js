import { OCCASIONS, PLANS, HUB } from '../data';
import { esc } from '../dom';
import { coverMarkup, examplePlan } from './gift';

function hero(key) {
  const o = key ? OCCASIONS[key] : null;
  const [category, ...title] = (o || HUB).title.split(' ');
  const sample = key || 'jubilee';
  const plan = PLANS[examplePlan(sample)];
  return `<section class="hero" id="hero" data-enter><div class="wrap hero-grid">
    <div class="hero-copy">${o ? '<a class="back-link" href="#home">Все поводы</a>' : '<p class="eyebrow">Личный подарок под ключ</p>'}
      <h1>${esc(category)}<br><span>${esc(title.join(' '))}</span></h1>
      <p class="hero-lead">${esc((o || HUB).lead)}</p>
      <div class="hero-facts"><p><strong>${o ? o.from : `Форматы от ${esc(PLANS.mini.price)}`}</strong></p><p>${key === 'wedding' ? 'Год размещения включён' : 'Мини за 2 дня'}</p></div>
      <div class="hero-actions"><a href="#request" data-scroll="request" class="button">Обсудить подарок</a><a href="#example" data-example class="button button-outline">Посмотреть пример</a></div>
      <p class="hero-note">Вы делитесь воспоминаниями. Мы собираем сайт.</p>
    </div>
    <div class="hero-visual"><div class="preview-label"><span>Так может выглядеть ваш подарок</span><span>Демо</span></div><div class="hero-device" data-slot="Превью сайта-подарка ${esc(OCCASIONS[sample].short)}">${coverMarkup(sample, { hero: true })}</div><p class="visual-note"><b>Пример формата «${esc(plan.name)}» · ${esc(plan.price)}</b><span>${esc(OCCASIONS[sample].gift.cover.title)} · вымышленная история</span></p></div>
  </div></section>`;
}

export const heroMarkup = () => hero(null);
export const landingMarkup = key => hero(key);
