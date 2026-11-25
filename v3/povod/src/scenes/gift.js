import { OCCASIONS, PLANS } from '../data';
import { $, $$, image, esc } from '../dom';

export function examplePlan(key = 'jubilee') {
  const sections = OCCASIONS[key].gift.sections;
  if (sections.some(section => section.type === 'quiz')) return 'prem';
  return sections.some(section => section.type === 'voices' || section.type === 'chapters') ? 'story' : 'mini';
}

function giftCover(g, hero = false, preview = false) {
  const heading = hero ? 'h2' : 'h3';
  const sizes = hero ? '(max-width: 767px) calc(100vw - 52px), 434px' : preview ? '270px' : '(max-width: 767px) calc(100vw - 40px), 760px';
  return `<section class="g-cover" data-block="cover" data-slot="Обложка подарка">${image(g.cover.img, g.cover.title, `${hero ? 'fetchpriority="high"' : 'loading="lazy"'} sizes="${sizes}"`)}<div><small>${esc(g.cover.small)}</small><${heading}>${esc(g.cover.title)}</${heading}><p>${esc(g.cover.sub)}</p></div></section>`;
}

function chapterMarkup(c, heading = 'h5') {
  return `<article class="g-chapter"><span>${esc(c.y)}</span><${heading}>${esc(c.h)}</${heading}><p>${esc(c.p)}</p>${c.img ? `<div data-slot="Фото главы ${esc(c.h)}">${image(c.img, c.h, 'loading="lazy"')}</div>` : ''}</article>`;
}

export function coverMarkup(key = 'jubilee', { hero = false } = {}) {
  const g = OCCASIONS[key].gift;
  const chapter = g.sections.find(s => s.type === 'chapters')?.items[0];
  return `<div class="gift-preview${hero ? ' gift-preview-hero' : ''}">${giftCover(g, hero, true)}${chapter ? `<div class="g-section g-chapters-section">${chapterMarkup(chapter, hero ? 'h3' : 'h4')}</div>` : ''}</div>`;
}

export function giftContents(g) {
  return giftCover(g) + g.sections.map(s => {
    const head = `<p class="g-label">${esc(s.label)}</p>${s.title ? `<h4>${esc(s.title)}</h4>` : ''}`;
    let body = '';
    switch (s.type) {
      case 'chapters': body = head + s.items.map(c => chapterMarkup(c)).join(''); break;
      case 'voices': body = head + `<ul class="g-voices">${s.items.map(v => `<li class="g-voice"><div class="voice-top"><b>${esc(v.n)}</b><small>${esc(v.t)}</small></div></li>`).join('')}</ul><p class="voice-note">Здесь будут голосовые близких. В этом примере аудиозаписей нет. Голосовые входят в пакет «История» и выше.</p>`; break;
      case 'letter': body = head + `<div class="g-letter">${esc(s.text)}<div class="sign">${esc(s.sign)}</div></div>`; break;
      case 'count': body = `<div class="g-count"><b>${Math.max(0, Math.floor((Date.now() - new Date(s.from).getTime()) / 86400000)).toLocaleString('ru-RU')}</b><span>${esc(s.unit)}</span><small>${esc(s.note)}</small></div>`; break;
      case 'gallery': body = head + `<div class="g-gallery">${s.imgs.map((p, i) => `<div data-slot="Галерея ${i + 1}">${image(p, `${g.cover.title}: фотография ${i + 1} из истории`, 'loading="lazy" sizes="(max-width: 767px) 28vw, 224px"')}</div>`).join('')}</div>`; break;
      case 'quiz': body = head + `<div class="g-quiz" data-quiz="${s.ok}"><p>${esc(s.q)}</p>${s.opts.map((t, i) => `<button type="button" data-answer="${i}" aria-pressed="false">${esc(t)}</button>`).join('')}<small>${esc(s.note)}</small><p class="quiz-result" role="status"></p></div><p class="small-note">Квиз входит в пакет «Премиум».</p>`; break;
      case 'reasons': body = head + `<div class="g-reasons" data-index="0"><button type="button" data-reason>${esc(s.items[0])}</button><small><span data-reason-count>1</span> из ${s.items.length} · нажмите, чтобы открыть следующую</small><script type="application/json" class="reason-data">${JSON.stringify(s.items).replace(/</g, '\\u003c')}</script></div>`; break;
      case 'recipe': body = head + `<ol class="g-recipe">${s.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`; break;
      case 'final': body = `<h4>${esc(s.title)}</h4><p>${esc(s.text)}</p>`; break;
    }
    return `<section class="g-section g-${s.type}-section" data-block="${s.type}">${body}</section>`;
  }).join('');
}

export function giftMarkup(key = 'jubilee') {
  const o = OCCASIONS[key];
  const plan = examplePlan(key);
  const comparison = o.plans.includes('mini') && plan !== 'mini' ? ' В «Мини» будет до 15 фото, одно письмо и музыка на готовом шаблоне, без хронологии и голосовых.' : key === 'wedding' ? ' Для свадьбы доступны «История» и «Премиум».' : '';
  return `<section id="example" class="section example-section" aria-labelledby="example-title"><div class="wrap">
    <div class="example-intro"><div class="example-copy"><p class="eyebrow">Пример сайта-подарка</p><h2 id="example-title">${esc(o.demoTitle)}</h2><p class="lead">${esc(o.card)}</p><p>Такой сайт можно открыть по ссылке на телефоне или компьютере. Посмотрите обложку, а затем откройте подарок целиком.</p><p class="example-includes">В примере показаны возможности формата «${esc(PLANS[plan].name)}».${comparison}</p><p class="example-note">Люди и истории вымышлены. Фотографии сгенерированы.</p><a class="text-link" href="#request" data-scroll="request">Обсудить подарок</a></div>
    <div class="phone" aria-label="Обложка и начало примера подарка"><div class="phone-camera" aria-hidden="true"></div><div class="phone-screen">${coverMarkup(key)}</div></div></div>
    <details id="gift-example" class="gift-example"><summary>Открыть подарок целиком</summary><div class="gift-reading">${giftContents(o.gift)}</div></details>
  </div></section>`;
}

export function mountGift() {
  const section = $('#example');
  if (!section) return { destroy() {} };
  const click = e => {
    const answer = e.target.closest('[data-answer]');
    if (answer) {
      const quiz = answer.closest('[data-quiz]'), ok = +quiz.dataset.quiz;
      const answers = $$('[data-answer]', quiz);
      answers.forEach(b => {
        b.classList.toggle('is-correct', +b.dataset.answer === ok);
        b.classList.toggle('is-wrong', b === answer && +b.dataset.answer !== ok);
        b.setAttribute('aria-pressed', String(b === answer));
      });
      $('.quiz-result', quiz).textContent = +answer.dataset.answer === ok ? 'Верно!' : `Правильный ответ: ${answers[ok].textContent}`;
    }
    const reason = e.target.closest('[data-reason]');
    if (reason) {
      const stack = reason.closest('.g-reasons'), items = JSON.parse($('.reason-data', stack).textContent);
      const i = (+stack.dataset.index + 1) % items.length;
      stack.dataset.index = i;
      reason.textContent = items[i];
      $('[data-reason-count]', stack).textContent = i + 1;
    }
  };
  section.addEventListener('click', click);
  return { destroy() { section.removeEventListener('click', click); } };
}
