import { PLANS, OCCASIONS, HUB } from '../data';
import { gsap, order, $$, image, maskedLines } from '../shared';

export function sectionsMarkup(key) {
  const o = key ? OCCASIONS[key] : null;
  return `<section class="section intro-section" id="about"><div class="wrap intro-grid"><p class="eyebrow">Больше, чем подарок</p><div><h2 class="reveal-lines">${maskedLines(HUB.title, 26)}</h2><p class="lead">${HUB.lead}</p><p class="small-note">${HUB.note}</p></div></div></section>
  <section id="prices" class="section prices-section"><div class="wrap"><div class="section-heading"><p class="eyebrow">Формат под вашу историю</p><h2 class="reveal-lines">${maskedLines('Выберите формат', 30)}</h2><p class="lead">${HUB.prices}</p></div>
    <div class="plans">${Object.entries(PLANS).map(([k, p]) => `<article class="plan ${p.main ? 'plan-main' : ''}">${p.main ? '<span class="plan-badge">Главный формат</span>' : `<span class="plan-index">0${k === 'mini' ? 1 : 3}</span>`}<h3 class="reveal-lines">${maskedLines(p.name, 30)}</h3><p class="plan-price reveal-lines">${maskedLines(p.price, 30)}</p><p class="plan-for">${p.for}</p><ul>${p.items.map(t => `<li class="reveal-lines">${maskedLines(t, 48)}</li>`).join('')}</ul><a href="#request" data-scroll="request" data-plan="${p.name}" class="button ${p.main ? '' : 'button-outline'}">Выбрать «${p.name}»</a></article>`).join('')}</div><p class="plans-extra">${o ? o.extra : HUB.extra}</p>${key === 'wedding' ? '<p class="small-note">Свадебный формат начинается с «Истории».</p>' : ''}</div></section>
  <section id="how" class="section steps-section"><div class="wrap"><div class="section-heading"><p class="eyebrow">Как это работает</p><h2 class="reveal-lines">${maskedLines('От вас истории, от нас всё остальное', 21)}</h2></div><ol class="steps">${(o?.steps || HUB.steps).map((s, i) => `<li><span class="step-number">0${i + 1}</span><h3>${s.b}</h3><p>${s.p}</p></li>`).join('')}</ol></div></section>
  <section id="faq" class="section faq-section"><div class="wrap faq-grid"><div><p class="eyebrow">Можно спросить</p><h2>Что обычно<br>спрашивают</h2></div><div>${(o?.faq || HUB.faq).map((f, i) => `<details name="povod-faq"><summary><span>${f.q}</span><i aria-hidden="true"></i></summary><div><p>${f.a}</p></div></details>`).join('')}</div></div></section>
  <section id="request" class="section request-section"><div class="wrap request-grid"><div><p class="eyebrow">Заявка</p><h2>Расскажите,<br>кого и с чем<br><span>поздравляем.</span></h2><p class="lead">Ответим в течение часа в рабочее время, подскажем идею и назовём точную цену.</p></div><form id="request-form"><label>Как к вам обращаться<input name="name" autocomplete="given-name" maxlength="80" required placeholder="Аня"></label><label>Телефон или Telegram<input name="contact" maxlength="120" required placeholder="+7 ... или @ник"></label><label>Повод<select name="occasion">${order.map(k => `<option ${k === key ? 'selected' : ''}>${OCCASIONS[k].name}</option>`).join('')}<option>Свой повод</option></select></label><label>Формат<select name="plan"><option>Пока не знаю</option>${Object.values(PLANS).map(p => `<option>${p.name}</option>`).join('')}</select></label><label class="wide">Когда праздник<input name="date" maxlength="100" placeholder="Например, 14 марта"></label><button type="submit" class="button">Отправить заявку</button><p class="form-note wide" role="status">Это макет: заявка не отправляется, данные никуда не передаются.</p></form></div></section>
  <section id="other" class="section other-section"><div class="wrap"><div class="section-heading"><p class="eyebrow">Хорошие люди заслуживают</p><h2>${o ? 'Другие поводы' : 'Ещё один повод'}</h2></div><div class="other-grid">${order.filter(k => k !== key).map(k => `<a href="#${k}" data-route="${k}"><div data-slot="Другой повод ${OCCASIONS[k].short}">${image(`v2/scenes/slide-${k}.jpg`, OCCASIONS[k].short)}</div><h3>${OCCASIONS[k].short}</h3><span>${OCCASIONS[k].from}</span></a>`).join('')}</div></div></section>
  <footer class="footer wrap"><a href="#home" class="logo">повод<span>.</span></a><p>Ваши люди. Ваши истории.</p><small>Демонстрационный проект. Люди и истории вымышлены.</small></footer>`;
}

export function mountSections(reduced) {
  if (reduced) return;
  $$('.reveal-lines').forEach(el => {
    gsap.fromTo($$('.line-mask > span', el), { yPercent: 115 }, { yPercent: 0, duration: .85, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
  });
  $$('.steps li').forEach(el => {
    gsap.from(el, { y: 45, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
}
