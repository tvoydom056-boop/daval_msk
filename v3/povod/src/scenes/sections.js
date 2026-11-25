import { PLANS, OCCASIONS, HUB } from '../data';
import { order, esc } from '../dom';
import { examplePlan } from './gift';

export function allowedPlanIds(occasionKey) {
  return order.includes(occasionKey) ? OCCASIONS[occasionKey].plans : Object.keys(PLANS);
}

export function planOptions(occasionKey, currentPlan = 'unknown') {
  const ids = allowedPlanIds(occasionKey);
  const selected = ids.includes(currentPlan) ? currentPlan : 'unknown';
  return `<option value="unknown"${selected === 'unknown' ? ' selected' : ''}>Пока не знаю</option>${ids.map(id => `<option value="${esc(id)}"${selected === id ? ' selected' : ''}>${esc(PLANS[id].name)}</option>`).join('')}`;
}

function occasionOptions(occasionKey) {
  return `<option value="unknown"${occasionKey === 'unknown' ? ' selected' : ''}>Пока не знаю</option>${order.map(id => `<option value="${esc(id)}"${occasionKey === id ? ' selected' : ''}>${esc(OCCASIONS[id].name)}</option>`).join('')}<option value="custom">Свой повод</option>`;
}

export function sectionsMarkup(key) {
  const occasionKey = order.includes(key) ? key : 'unknown';
  const o = OCCASIONS[occasionKey];
  const samplePlan = examplePlan(key || 'jubilee');
  const inside = [
    { title: 'Фотографии и главы', text: o?.plans.includes('mini') === false ? 'До 40 фото и хронология в «Истории» и «Премиуме».' : 'До 15 фото в «Мини». До 40 фото и хронология в «Истории» и «Премиуме».' },
    { title: 'Письма и голосовые', text: o?.plans.includes('mini') === false ? 'Рукописное оформление письма и голосовые поздравления входят в оба формата.' : 'Одно письмо в «Мини». Рукописное оформление и голосовые поздравления в «Истории» и «Премиуме».' },
    { title: 'Музыка и анимации', text: 'Музыка входит во все форматы. Анимации доступны в «Истории» и «Премиуме».' },
    { title: 'Видео и интерактив', text: 'В «Премиуме»: ролик 30-60 секунд, оживление фото, индивидуальный дизайн и мини-игра или квиз.' }
  ];

  return `<section class="section" id="inside"><div class="wrap">
    <div class="section-heading"><h2>Что будет на вашем сайте</h2><p class="lead">Содержание зависит от формата. Сначала согласуем материалы и состав, затем соберём страницу.</p></div>
    <div class="inside-grid">${inside.map(item => `<article class="inside-item"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>
  </div></section>
  <section class="section" id="how"><div class="wrap">
    <div class="section-heading"><h2>Как заказать сайт-подарок</h2></div>
    <ol class="steps">${HUB.steps.map(step => `<li><h3>${esc(step.b)}</h3><p>${esc(step.p)}</p></li>`).join('')}</ol>
  </div></section>
  <section class="section" id="prices"><div class="wrap">
    <div class="section-heading"><h2>Форматы и стоимость</h2><p class="lead">${esc(HUB.prices)}</p></div>
    <div class="plans">${allowedPlanIds(occasionKey).map(id => {
      const plan = PLANS[id];
      const actionName = id === 'story' ? 'Историю' : plan.name;
      return `<article class="plan${plan.main ? ' plan-main' : ''}">${plan.main ? '<span class="plan-badge">Основной формат</span>' : ''}<h3>${esc(plan.name)}</h3><p class="plan-price">${esc(plan.price)}</p>${id === samplePlan ? '<p class="plan-example">Как в примере выше</p>' : '<div class="plan-example-space" aria-hidden="true"></div>'}<p class="plan-for">${esc(plan.for)}</p><ul>${plan.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul><a class="button${plan.main ? '' : ' button-outline'}" href="#request" data-scroll="request" data-plan="${esc(id)}" data-occasion="${esc(occasionKey)}">Выбрать «${esc(actionName)}»</a></article>`;
    }).join('')}</div>
    <div class="plans-extra"><p>${esc(HUB.extra)}</p>${occasionKey === 'wedding' ? '<p>Свадебный сайт начинается с «Истории». Гостевой альбом по QR можно добавить за 1 990 ₽.</p>' : ''}<p>Тестовые цены демонстрационного проекта. Точную стоимость согласуем до начала работы.</p></div>
  </div></section>
  <section class="section" id="faq"><div class="wrap faq-grid">
    <div class="section-heading"><h2>Вопросы о подарке</h2></div>
    <div class="faq-list">${HUB.faq.map(item => `<details name="povod-faq"><summary>${esc(item.q)}</summary><div><p>${esc(item.a)}</p></div></details>`).join('')}</div>
  </div></section>
  <section class="section" id="request"><div class="wrap request-grid">
    <div class="section-heading"><h2>Расскажите о вашем поводе</h2><p class="lead">Выберите повод и формат. Если пока не решили, оставьте «Пока не знаю».</p></div>
    <form id="request-form" aria-describedby="request-note"><div class="form-grid">
      <label for="request-name">Как к вам обращаться<input id="request-name" name="name" autocomplete="given-name" maxlength="80" required></label>
      <label for="request-contact">Телефон или Telegram<input id="request-contact" name="contact" autocomplete="tel" maxlength="120" required placeholder="Телефон или @имя"></label>
      <label for="request-occasion">Повод<select id="request-occasion" name="occasion">${occasionOptions(occasionKey)}</select></label>
      <label for="request-plan">Формат<select id="request-plan" name="plan">${planOptions(occasionKey)}</select></label>
      <label class="wide" for="request-date">Когда праздник, если дата известна<input id="request-date" name="date" maxlength="100" placeholder="Например, 14 марта"></label>
      <p class="form-note wide" id="request-note">Это демонстрационная форма. Заявка не отправляется, данные никуда не передаются. Демо не принимает материалы и оплату.</p>
      <button type="submit" class="button wide">Отправить заявку</button>
      <p class="form-note wide" id="request-status" role="status" aria-live="polite"></p>
    </div></form>
  </div></section>
  <footer class="footer"><div class="wrap">
    ${o ? `<nav class="other-links" aria-label="Другие поводы"><span>Другие поводы</span>${order.filter(id => id !== occasionKey).map(id => `<a href="#${esc(id)}" data-route="${esc(id)}">${esc(OCCASIONS[id].short)}</a>`).join('')}</nav>` : ''}
    <a href="#home" data-route="home" class="logo" aria-label="Повод - на главную">повод<span>.</span></a>
    <p>Сайты-подарки с вашей историей.</p><small>Демонстрационный проект. Люди и истории вымышлены, цены тестовые.</small>
  </div></footer>`;
}
