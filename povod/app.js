/* Повод - вёрстка из data.js и интерактив */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const occKey = document.body.dataset.occasion;
  const SPA = document.body.hasAttribute('data-spa');
  const ORDER = ['wedding', 'birthday', 'anniversary', 'jubilee'];
  const COLORS = { wedding: 'var(--wed)', birthday: 'var(--bday)', anniversary: 'var(--anni)', jubilee: 'var(--jub)' };
  const nf = n => n.toLocaleString('ru-RU');

  const card = k => {
    const o = OCCASIONS[k];
    return `<a class="occ__card" href="${SPA ? '#' + k : k + '.html'}" style="--c:${COLORS[k]}" data-slot="ФОТО 3:4 или ВИДЕО-превью 5-6 с без звука (${o.short.toLowerCase()}). Видео стартует при наведении">
      <img src="${o.img}" alt="" loading="lazy">
      <span class="occ__tag">${o.short}</span>
      <h3>${o.name}</h3><p>${o.card}</p>
      <span class="occ__price">${o.from}<span>Смотреть пример</span></span></a>`;
  };

  /* содержимое подарка */
  const gift = (g, standalone = false) => {
    const coverTag = standalone ? 'h1' : 'h3';
    const sectionTag = standalone ? 'h2' : 'h4';
    const chapterTag = standalone ? 'h3' : 'h5';
    const s = g.sections.map(x => {
      const head = `<p class="g-label">${x.label || ''}</p>${x.title ? `<${sectionTag}>${x.title}</${sectionTag}>` : ''}`;
      switch (x.type) {
        case 'chapters': return `<section class="g-sec">${head}${x.items.map(c => `
          <div class="g-ch"><b>${c.y}</b><${chapterTag}>${c.h}</${chapterTag}><p>${c.p}</p>${c.img ? `<img src="${c.img}" alt="" loading="lazy">` : ''}</div>`).join('')}</section>`;
        case 'voices': return `<section class="g-sec">${head}<div class="g-voices">${x.items.map(v => `
          <div class="g-voice rel" data-slot="ГОЛОСОВОЕ: короткая запись близкого без фоновой музыки">
            <strong class="g-voice__n">${v.n}</strong>
            <p class="g-voice__caption">${v.src ? 'Синтезированный пример' : `Место для записи · ${v.t}`}</p>
            ${v.src ? `<audio aria-label="Поздравление: ${v.n}" src="${v.src}" controls preload="none"></audio>
            <details><summary>Текст поздравления</summary><p>${v.transcript}</p></details>` : ''}
          </div>`).join('')}</div></section>`;
        case 'letter': return `<section class="g-sec"><p class="g-label">${x.label}</p><div class="g-letter">${x.text}<div class="sign">${x.sign}</div></div></section>`;
        case 'gallery': return `<section class="g-sec">${head}<div class="g-gallery">${x.imgs.map(i => `<img src="${i}" alt="" loading="lazy">`).join('')}</div></section>`;
        case 'count': {
          const d = Math.floor((Date.now() - new Date(x.from).getTime()) / 864e5);
          return `<section class="g-sec"><div class="g-count"><b>${nf(d)}</b><span>${x.unit}<br>${x.note}</span></div></section>`;
        }
        case 'reasons': return `<section class="g-sec">${head}<div class="g-reasons" data-reasons>${x.items.map((r, i) => `
          <div class="g-reason" style="z-index:${x.items.length - i};transform:rotate(${(i % 2 ? 1 : -1) * Math.min(i, 3)}deg)"><p>${r}</p><small>${i + 1} из ${x.items.length} · нажмите, чтобы открыть следующую</small></div>`).join('')}</div></section>`;
        case 'quiz': return `<section class="g-sec">${head}<div class="g-quiz" data-quiz="${x.ok}"><p>${x.q}</p>${x.opts.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}<small>${x.note}</small></div></section>`;
        case 'recipe': return `<section class="g-sec">${head}<div class="g-recipe"><ol>${x.steps.map(t => `<li>${t}</li>`).join('')}</ol></div></section>`;
        case 'final': return `<section class="g-final"><${sectionTag}>${x.title}</${sectionTag}><p>${x.text}</p></section>`;
      }
      return '';
    }).join('');
    return `<div class="g-cover rel" data-slot="ОБЛОЖКА: фото или видео 9:16 героя/пары, 5-8 с, луп"><img src="${g.cover.img}" alt=""><small>${g.cover.small}</small><${coverTag}>${g.cover.title}</${coverTag}><p>${g.cover.sub}</p></div>${s}`;
  };

  const pauseAudio = (root, current) => $$('audio', root).forEach(audio => {
    if (audio !== current) audio.pause();
  });
  document.addEventListener('play', e => {
    if (e.target instanceof HTMLAudioElement) pauseAudio(document, e.target);
  }, true);
  addEventListener('pagehide', () => pauseAudio(document));

  const bindGift = root => {
    if (root.hasAttribute('data-gift-bound')) return;
    root.setAttribute('data-gift-bound', '');
    $$('[data-reasons]', root).forEach(box => {
      const cards = $$('.g-reason', box); let i = 0;
      box.addEventListener('click', () => {
        if (i < cards.length - 1) { cards[i].classList.add('is-out'); i++; }
        else { cards.forEach(c => c.classList.remove('is-out')); i = 0; }
      });
    });
    $$('[data-quiz]', root).forEach(q => {
      const ok = +q.dataset.quiz;
      $$('button', q).forEach(b => b.addEventListener('click', () => {
        $$('button', q).forEach(x => x.classList.remove('ok', 'no'));
        b.classList.add(+b.dataset.i === ok ? 'ok' : 'no');
        if (+b.dataset.i !== ok) $$('button', q)[ok].classList.add('ok');
      }));
    });
  };

  const giftStory = $('#giftStory');
  if (giftStory) {
    giftStory.innerHTML = gift(OCCASIONS[occKey].gift, true);
    bindGift(giftStory);
    return;
  }

  const plan = k => {
    const p = PLANS[k];
    return `<div class="plan${p.main ? ' plan--main' : ''}">${p.main ? '<span class="plan__badge">Рекомендуем</span>' : ''}
      <h3>${p.name}</h3><p class="plan__price">${p.price}</p><p class="plan__for">${p.for}</p>
      <ul>${p.items.map(i => `<li>${i}</li>`).join('')}</ul>
      <a class="btn ${p.main ? 'btn--acc' : 'btn--line'}" href="#request" data-plan="${p.name}">Выбрать «${p.name}»</a></div>`;
  };

  /* главная */
  const occGrid = $('#occGrid');
  if (occGrid) occGrid.innerHTML = ORDER.map(card).join('');

  /* страница повода */
  const page = $('#page');
  let full = null;
  const openFull = () => {
    pauseAudio(page);
    full.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('#closeFull').focus({ preventScroll: true });
  };
  const closeFull = () => {
    if (!full || !full.classList.contains('is-open')) return;
    pauseAudio(full);
    full.classList.remove('is-open');
    document.body.style.overflow = '';
    $('#openFull')?.focus({ preventScroll: true });
  };
  addEventListener('keydown', e => { if (e.key === 'Escape') closeFull(); }, true);
  const renderOcc = key => {
    const o = OCCASIONS[key];
    const demoPlan = PLANS[o.demoPlan];
    closeFull();
    pauseAudio(page);
    document.body.dataset.occasion = key;
    if (SPA || key !== 'jubilee') document.title = `${o.name} - сайт-подарок | Повод`;
    page.innerHTML = `
    <section class="ohero">
      <div class="ohero__media" data-slot="${o.heroSlot}"><img src="${o.img}" alt=""></div>
      <div class="wrap ohero__in">
        <p class="eyebrow">${o.name}</p>
        <h1>${o.title}</h1>
        <p class="ohero__lead">${o.lead}</p>
        <div class="ohero__actions"><a class="btn btn--acc" href="${key === 'jubilee' && !SPA ? 'jubilee-demo.html' : '#demo'}">Посмотреть пример</a><a class="btn btn--line-light" href="#oprices">Цены ${o.from}</a></div>
      </div>
    </section>

    <section class="sec" id="demo">
      <div class="wrap demo">
        <div class="demo__text">
          <p class="eyebrow">Живой пример</p>
          <h2>${o.demoTitle}</h2>
          ${o.demoText.map(t => `<p>${t}</p>`).join('')}
          ${demoPlan ? `<p><strong>Главы и голосовые входят в тариф «${demoPlan.name}» за ${demoPlan.price}.</strong></p>` : ''}
          <ul class="demo__list">${o.demoList.map(t => `<li>${t}</li>`).join('')}</ul>
          <button class="btn btn--ink" id="openFull">Открыть пример на весь экран</button>
        </div>
        <div>
          <div class="phone"><div class="phone__screen"><div class="gift" id="giftPhone">${gift(o.gift)}</div><span class="phone__hint" id="phoneHint">Листайте внутри телефона</span></div></div>
        </div>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><p class="eyebrow">Что внутри</p><h2>Из чего собираем подарок</h2></div>
        <ul class="inside">${o.inside.map(i => `<li><b>${i.b}</b><span>${i.s}</span></li>`).join('')}</ul>
      </div>
    </section>

    <section class="sec" id="oprices">
      <div class="wrap">
        <div class="sec__head"><p class="eyebrow">Цены</p><h2>Выберите формат</h2><p class="sec__lead">Цена фиксируется до начала работы. Размещение на год включено, продление 290 ₽ в год.</p></div>
        <div class="plans" style="${o.plans.length === 2 ? 'max-width:820px' : ''}">${o.plans.map(plan).join('')}</div>
        <p class="plans__extra">${o.extra}</p>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><p class="eyebrow">Как это работает</p><h2>От вас истории, от нас всё остальное</h2></div>
        <ol class="steps">${o.steps.map(s => `<li><b>${s.b}</b><p>${s.p}</p></li>`).join('')}</ol>
      </div>
    </section>

    <section class="sec" id="ofaq">
      <div class="wrap faq">
        <div class="sec__head"><p class="eyebrow">Вопросы</p><h2>Что обычно спрашивают</h2></div>
        <div>${o.faq.map((f, i) => `<details${i ? '' : ' open'}><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</div>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><p class="eyebrow">Другие поводы</p><h2>Сделаем и для другого случая</h2></div>
        <div class="others">${ORDER.filter(k => k !== key).map(card).join('')}</div>
      </div>
    </section>`;

    if (full) full.parentNode.removeChild(full);
    full = document.createElement('div');
    full.className = 'gift-full'; full.innerHTML = `<button class="gift-full__close" id="closeFull">Закрыть пример</button><div class="gift" id="giftFull">${gift(o.gift)}</div>`;
    document.body.appendChild(full);
    bindGift($('#giftPhone')); bindGift($('#giftFull'));
    $('#openFull').addEventListener('click', openFull);
    $('#closeFull').addEventListener('click', closeFull);
    full.addEventListener('click', e => { if (e.target === full) closeFull(); });
    $('#giftPhone').addEventListener('scroll', () => { $('#phoneHint').style.opacity = 0; }, { once: true });
    const sel = $('#occSelect'); if (sel) sel.value = o.name;
    const requestedPlan = new URLSearchParams(location.search).get('plan');
    const planSelect = $('#planSelect');
    if (!SPA && planSelect && o.plans.includes(requestedPlan)) planSelect.value = PLANS[requestedPlan].name;
  };
  if (page && occKey && !SPA) renderOcc(occKey);

  /* одна страница со всеми поводами (для публикации ссылкой): #wedding, #birthday ... */
  if (SPA) {
    const hub = $('#hub'), hubTitle = document.title;
    $$('[data-spa-href]', hub).forEach(a => { a.href = a.dataset.spaHref; });
    const showHub = () => {
      closeFull();
      pauseAudio(page);
      hub.hidden = false;
      page.hidden = true;
      page.innerHTML = '';
      delete document.body.dataset.occasion;
      document.title = hubTitle;
    };
    const route = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const opensDemo = h === 'jubilee-demo';
      const key = opensDemo ? 'jubilee' : h;
      if (Object.hasOwn(OCCASIONS, key)) {
        hub.hidden = true;
        page.hidden = false;
        renderOcc(key);
        scrollTo(0, 0);
        if (opensDemo) openFull();
      } else if (!h || h === 'home') { showHub(); scrollTo(0, 0); }
      else if (hub.hidden && hub.querySelector('#' + CSS.escape(h))) { showHub(); document.getElementById(h).scrollIntoView(); }
    };
    addEventListener('hashchange', route); route();
  }

  /* общее */
  document.addEventListener('click', e => { const a = e.target.closest('[data-plan]'); const s = $('#planSelect'); if (a && s) s.value = a.dataset.plan; });
  const form = $('#form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      $('#formNote').textContent = 'Демо-заявка заполнена. Отправка появится после подключения контактов.';
    });
    $('button[type="submit"]', form).disabled = false;
  }
  $('#slotsToggle').addEventListener('click', () => document.body.classList.toggle('show-slots'));
})();
