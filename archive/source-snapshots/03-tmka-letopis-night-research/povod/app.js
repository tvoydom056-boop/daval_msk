/* Повод - вёрстка из data.js и интерактив */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const occKey = document.body.dataset.occasion;
  const SPA = document.body.hasAttribute('data-spa');
  const ORDER = ['wedding', 'birthday', 'anniversary', 'jubilee'];
  const COLORS = { wedding: 'var(--wed)', birthday: 'var(--bday)', anniversary: 'var(--anni)', jubilee: 'var(--jub)' };
  const bars = (n, seed = 1) => Array.from({ length: n }, (_, i) => `<i style="height:${Math.round(25 + 75 * Math.abs(Math.sin(i * 0.7 + seed) * Math.cos(i * 0.23 + seed * 2)))}%"></i>`).join('');
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
  const gift = g => {
    const s = g.sections.map((x, si) => {
      const head = `<p class="g-label">${x.label || ''}</p>${x.title ? `<h4>${x.title}</h4>` : ''}`;
      switch (x.type) {
        case 'chapters': return `<section class="g-sec">${head}${x.items.map(c => `
          <div class="g-ch"><b>${c.y}</b><h5>${c.h}</h5><p>${c.p}</p>${c.img ? `<img src="${c.img}" alt="" loading="lazy">` : ''}</div>`).join('')}</section>`;
        case 'voices': return `<section class="g-sec">${head}<div class="g-voices">${x.items.map((v, i) => `
          <button class="g-voice" data-voice><span class="vplay"></span><span class="g-voice__b"><span class="g-voice__n">${v.n}</span><span class="vbars">${bars(26, i + 1)}</span></span><span class="vtime">${v.t}</span></button>`).join('')}</div></section>`;
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
        case 'final': return `<section class="g-final"><h4>${x.title}</h4><p>${x.text}</p></section>`;
      }
      return '';
    }).join('');
    return `<div class="g-cover rel" data-slot="ОБЛОЖКА: фото или видео 9:16 героя/пары, 5-8 с, луп"><img src="${g.cover.img}" alt=""><small>${g.cover.small}</small><h3>${g.cover.title}</h3><p>${g.cover.sub}</p></div>${s}`;
  };

  const bindGift = root => {
    $$('[data-voice]', root).forEach(b => b.addEventListener('click', () => {
      const on = !b.classList.contains('is-play');
      $$('[data-voice]', root).forEach(x => { x.classList.remove('is-play'); clearInterval(x._t); $$('.vbars i', x).forEach(i => i.classList.remove('on')); });
      if (!on) return;
      b.classList.add('is-play');
      const is = $$('.vbars i', b); let k = 0;
      b._t = setInterval(() => { if (k >= is.length) { clearInterval(b._t); b.classList.remove('is-play'); is.forEach(i => i.classList.remove('on')); return; } is[k++].classList.add('on'); }, 160);
    }));
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

  const plan = k => {
    const p = PLANS[k];
    return `<div class="plan${p.main ? ' plan--main' : ''}">${p.main ? '<span class="plan__badge">Чаще выбирают</span>' : ''}
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
  const closeFull = () => { if (full) full.classList.remove('is-open'); document.body.style.overflow = ''; };
  addEventListener('keydown', e => { if (e.key === 'Escape') closeFull(); });
  const renderOcc = key => {
    const o = OCCASIONS[key];
    document.body.dataset.occasion = key;
    document.title = `${o.name} - сайт-подарок | Повод`;
    page.innerHTML = `
    <section class="ohero">
      <div class="ohero__media" data-slot="${o.heroSlot}"><img src="${o.img}" alt=""></div>
      <div class="wrap ohero__in">
        <p class="eyebrow">${o.name}</p>
        <h1>${o.title}</h1>
        <p class="ohero__lead">${o.lead}</p>
        <div class="ohero__actions"><a class="btn btn--acc" href="#demo">Посмотреть пример</a><a class="btn btn--line-light" href="#oprices">Цены ${o.from}</a></div>
      </div>
    </section>

    <section class="sec" id="demo">
      <div class="wrap demo">
        <div class="demo__text">
          <p class="eyebrow">Живой пример</p>
          <h2>${o.demoTitle}</h2>
          ${o.demoText.map(t => `<p>${t}</p>`).join('')}
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
    $('#openFull').addEventListener('click', () => { full.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
    $('#closeFull').addEventListener('click', closeFull);
    full.addEventListener('click', e => { if (e.target === full) closeFull(); });
    $('#giftPhone').addEventListener('scroll', () => { $('#phoneHint').style.opacity = 0; }, { once: true });
    const sel = $('#occSelect'); if (sel) sel.value = o.name;
  };
  if (page && occKey && !SPA) renderOcc(occKey);

  /* одна страница со всеми поводами (для публикации ссылкой): #wedding, #birthday ... */
  if (SPA) {
    const hub = $('#hub'), hubTitle = document.title;
    const showHub = () => { hub.hidden = false; page.hidden = true; page.innerHTML = ''; delete document.body.dataset.occasion; document.title = hubTitle; };
    const route = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (OCCASIONS[h]) { hub.hidden = true; page.hidden = false; renderOcc(h); scrollTo(0, 0); }
      else if (!h || h === 'home') { showHub(); scrollTo(0, 0); }
      else if (hub.hidden && hub.querySelector('#' + CSS.escape(h))) { showHub(); document.getElementById(h).scrollIntoView(); }
    };
    addEventListener('hashchange', route); route();
  }

  /* общее */
  document.addEventListener('click', e => { const a = e.target.closest('[data-plan]'); const s = $('#planSelect'); if (a && s) s.value = a.dataset.plan; });
  const form = $('#form');
  if (form) form.addEventListener('submit', e => { e.preventDefault(); $('#formNote').textContent = 'Это макет: заявка не отправляется. В рабочей версии она придёт нам в Telegram.'; });
  $('#slotsToggle').addEventListener('click', () => document.body.classList.toggle('show-slots'));

  /* главная: плеер в плавающей карточке */
  const fv = $('.float--voice');
  if (fv) { const is = $$('.vbars i', fv); let k = 0; setInterval(() => { is.forEach((i, j) => i.classList.toggle('on', j < k)); k = (k + 1) % (is.length + 6); }, 180); }
})();
