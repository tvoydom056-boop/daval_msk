import { OCCASIONS } from '../data';
import { gsap, pin, $, $$, image, esc } from '../shared';

const bars = seed => Array.from({ length: 26 }, (_, i) => `<i style="height:${Math.round(20 + 80 * Math.abs(Math.sin(i * .7 + seed) * Math.cos(i * .23 + seed * 2)))}%"></i>`).join('');
export function giftContents(g) {
  return `<section class="g-cover" data-block="cover" data-slot="Обложка подарка">${image(g.cover.img, g.cover.title)}<div><small>${g.cover.small}</small><h3>${g.cover.title}</h3><p>${g.cover.sub}</p></div></section>` + g.sections.map(s => {
    const head = `<p class="g-label">${s.label || ''}</p>${s.title ? `<h4>${s.title}</h4>` : ''}`;
    let body = '';
    switch (s.type) {
      case 'chapters': body = head + s.items.map(c => `<article class="g-chapter"><span>${c.y}</span><h5>${c.h}</h5><p>${c.p}</p>${c.img ? `<div data-slot="Фото главы ${esc(c.h)}">${image(c.img, c.h)}</div>` : ''}</article>`).join(''); break;
      case 'voices': body = head + s.items.map((v, i) => `<button class="g-voice" type="button" data-voice><span class="voice-top"><b>${v.n}</b><small>${v.t}</small></span><span class="voice-wave">${bars(i + 1)}</span><span class="voice-action">Слушать</span></button>`).join('') + '<p class="voice-note" role="status">Демонстрация плеера. Записи в макет не добавлены.</p>'; break;
      case 'letter': body = head + `<div class="g-letter">${s.text}<div class="sign">${s.sign}</div></div>`; break;
      case 'count': body = `<div class="g-count"><b>${Math.max(0, Math.floor((Date.now() - new Date(s.from).getTime()) / 86400000)).toLocaleString('ru-RU')}</b><span>${s.unit}</span><small>${s.note}</small></div>`; break;
      case 'gallery': body = head + `<div class="g-gallery">${s.imgs.map((p, i) => `<div data-slot="Галерея ${i + 1}">${image(p, 'Фото из истории')}</div>`).join('')}</div>`; break;
      case 'quiz': body = head + `<div class="g-quiz" data-quiz="${s.ok}"><p>${s.q}</p>${s.opts.map((t, i) => `<button type="button" data-answer="${i}">${t}</button>`).join('')}<small>${s.note}</small><p class="quiz-result" role="status"></p></div>`; break;
      case 'reasons': body = head + `<div class="g-reasons" data-index="0"><button type="button" data-reason>${s.items[0]}</button><small><span data-reason-count>1</span> из ${s.items.length} · нажмите, чтобы открыть следующую</small><script type="application/json" class="reason-data">${JSON.stringify(s.items).replace(/</g, '\\u003c')}</script></div>`; break;
      case 'recipe': body = head + `<ol class="g-recipe">${s.steps.map(t => `<li>${t}</li>`).join('')}</ol>`; break;
      case 'final': body = `<h4>${s.title}</h4><p>${s.text}</p>`; break;
    }
    return `<section class="g-section g-${s.type}-section" data-block="${s.type}">${body}</section>`;
  }).join('');
}

export function giftMarkup(key) {
  const o = OCCASIONS[key];
  return `<section id="phone" class="phone-stage pinned-stage" aria-label="Подарок в телефоне">
    <div class="phone-intro"><p class="eyebrow">Живой пример · Вымышленная история</p><h2>Вся история.<br><span>Ближе, чем кажется.</span></h2><p>${o.demoText[0]}</p><a class="text-link" href="#request" data-scroll="request">Хочу такой подарок</a></div>
    <div class="phone-aura" aria-hidden="true"></div><div class="phone"><div class="phone-camera" aria-hidden="true"></div><div class="phone-screen" tabindex="0" role="region" aria-label="Пример подарка - прокрутка страницы листает телефон"><div class="gift-content">${giftContents(o.gift)}</div></div></div>
    <div class="phone-annotation" aria-live="off"><small data-phone-number>01 / ${o.gift.sections.length + 1}</small><h3 data-phone-caption>${o.demoTitle}</h3><p data-phone-description>Настоящие чувства. Ваши фотографии. Ваша ссылка.</p><span class="annotation-line" aria-hidden="true"></span></div>
    <div class="phone-progress" aria-hidden="true"><i></i></div><p class="phone-footer">Листайте страницу - подарок листается вместе с вами</p>
  </section>`;
}

export function mountGift(key, reduced) {
  const screen = $('.phone-screen'), content = $('.gift-content');
  if (!screen) return { destroy() {} };
  const names = { cover: OCCASIONS[key].demoTitle, chapters: 'Ваша история по главам', voices: 'Голосовые от друзей', letter: 'Рукописное письмо', gallery: 'Те самые фотографии', count: 'Каждый день вместе', reasons: '10 причин, почему ты', quiz: 'Квиз про героя', recipe: 'Тот самый семейный рецепт', final: 'И это только начало' };
  const descriptions = { cover: 'Настоящие чувства. Ваши фотографии. Ваша ссылка.', chapters: 'Все маленькие моменты, из которых сложилось большое.', voices: 'Голоса, которые хочется слышать снова.', letter: 'Ваши слова. Без особенного повода говорить их вслух.', gallery: 'Даже те, на которых все закрыли глаза.', count: 'Обновляется каждый день.', reasons: 'Открывайте карточки по одной.', quiz: 'Для тех, кто знает героя лучше всех. Или думает, что знает.', recipe: 'Записанный с её слов. Вместе с «на глаз».', final: OCCASIONS[key].gift.sections.at(-1).text };
  const blocks = $$('[data-block]', content);
  let last = '';
  const state = { progress: 0 };
  function sync() {
    const max = Math.max(0, content.scrollHeight - screen.clientHeight);
    const y = state.progress * max;
    content.style.transform = `translate3d(0,${-y}px,0)`;
    const block = blocks.find(b => b.offsetTop + b.offsetHeight > y + screen.clientHeight * .4) || blocks.at(-1);
    const type = block.dataset.block;
    if (type !== last) {
      $('[data-phone-caption]').textContent = names[type];
      $('[data-phone-description]').textContent = descriptions[type];
      $('[data-phone-number]').textContent = `${String(blocks.indexOf(block) + 1).padStart(2, '0')} / ${blocks.length}`;
      if (!reduced) gsap.fromTo('.phone-annotation h3,.phone-annotation p', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .05, overwrite: true });
      last = type;
    }
  }
  const click = e => {
    const voice = e.target.closest('[data-voice]');
    if (voice) $('.voice-note', voice.parentNode).textContent = 'В макете нет аудиозаписи. В готовом подарке здесь будет голос близкого человека.';
    const answer = e.target.closest('[data-answer]');
    if (answer) {
      const quiz = answer.closest('[data-quiz]'), ok = +quiz.dataset.quiz;
      $$('[data-answer]', quiz).forEach(b => { b.classList.toggle('is-correct', +b.dataset.answer === ok); b.classList.toggle('is-wrong', b === answer && +b.dataset.answer !== ok); });
      $('.quiz-result', quiz).textContent = +answer.dataset.answer === ok ? 'Верно! Палатку. Три гитары зато были.' : 'Почти! Правильный ответ выделен.';
    }
    const reason = e.target.closest('[data-reason]');
    if (reason) {
      const stack = reason.closest('.g-reasons'), items = JSON.parse($('.reason-data', stack).textContent);
      const i = (+stack.dataset.index + 1) % items.length; stack.dataset.index = i;
      reason.textContent = items[i]; $('[data-reason-count]', stack).textContent = i + 1;
      if (!reduced) gsap.fromTo(reason, { rotation: -3, y: 10 }, { rotation: 0, y: 0, duration: .3 });
    }
  };
  content.addEventListener('click', click);
  let timeline, observer;
  if (!reduced) {
    timeline = pin('phone', '.phone-stage', 200);
    timeline.to(state, { progress: 1, duration: 100, onUpdate: sync }, 0)
      .fromTo('.phone-progress i', { scaleX: 0 }, { scaleX: 1, duration: 100 }, 0);
    observer = new ResizeObserver(sync); observer.observe(content); observer.observe(screen);
    sync();
  }
  // Keyboard users can advance the pinned gift without finding a scroll wheel.
  const keyboard = e => {
    if (reduced || !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key) || e.target.matches('button')) return;
    e.preventDefault();
    const st = timeline.scrollTrigger;
    const delta = e.key.includes('Down') ? .045 : -.045;
    const p = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : Math.max(0, Math.min(1, state.progress + delta));
    window.__lenis?.scrollTo(st.start + (st.end - st.start) * p, { immediate: true });
  };
  screen.addEventListener('keydown', keyboard);
  return { timeline, sync, destroy() { observer?.disconnect(); content.removeEventListener('click', click); screen.removeEventListener('keydown', keyboard); } };
}
