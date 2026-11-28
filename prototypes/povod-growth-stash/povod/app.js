/* Повод - вёрстка из data.js, переключение тарифов, проверка даты и интерактив */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const occKey = document.body.dataset.occasion;
  const SPA = document.body.hasAttribute('data-spa');
  const ORDER = ['wedding', 'birthday', 'anniversary', 'jubilee'];
  const HERO_ORDER = ['jubilee', 'wedding', 'birthday', 'anniversary'];
  const COLORS = {
    wedding: 'var(--wed)',
    birthday: 'var(--bday)',
    anniversary: 'var(--anni)',
    jubilee: 'var(--jub)'
  };
  const nf = n => n.toLocaleString('ru-RU');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  /* слой аналитики микро-конверсий (готов к подключению Метрики) */
  const events = window.__povodEvents = window.__povodEvents || [];
  let lastCta = 'direct';
  const track = (name, detail = {}) => {
    const item = { name, detail, ts: Date.now() };
    events.push(item);
    document.dispatchEvent(new CustomEvent('povod:event', { detail: item }));
  };

  /* слоты медиа доступны на любой странице, включая отдельное демо */
  $('#slotsToggle')?.addEventListener('click', () => {
    const on = document.body.classList.toggle('show-slots');
    track('toggle_slots', { on });
  });

  const copyText = async (text, btn, idleLabel) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    } catch (_) {
      /* fallback для локальных файлов без https */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (__) {}
      ta.remove();
    }
    if (btn) {
      btn.textContent = 'Скопировано';
      setTimeout(() => { btn.textContent = idleLabel; }, 1800);
    }
  };

  const card = k => {
    const o = OCCASIONS[k];
    return `<a class="occ__card" href="${SPA ? '#' + k : k + '.html'}" style="--c:${COLORS[k]}" data-cta="card-${k}">
      <div class="occ__media rel" data-slot="Обложка повода «${esc(o.short)}»"><img src="${esc(o.img)}" alt="" loading="lazy"></div>
      <div class="occ__copy"><h3>${esc(o.name)}</h3><p>${esc(o.card)}</p>
      <span class="occ__price">${esc(o.from)}<span>Смотреть пример</span></span></div></a>`;
  };

  /* содержимое подарка с фильтрацией по тарифу */
  const gift = (g, standalone = false, tierKey = 'story') => {
    const coverTag = standalone ? 'h1' : 'h3';
    const sectionTag = standalone ? 'h2' : 'h4';
    const chapterTag = standalone ? 'h3' : 'h5';
    const planObj = PLANS[tierKey] || PLANS.story;
    const allowed = new Set(planObj.includes);

    const visibleSections = g.sections.filter(x => x.type === 'final' || allowed.has(x.type));
    const missingHint = tierKey === 'mini'
      ? `<div class="g-tier-banner">Показана комплектация «Мини» (1 990 ₽): обложка, письмо и галерея. Главы истории и голосовые добавляются в «Истории».</div>`
      : '';

    const s = visibleSections.map(x => {
      const head = `<p class="g-label">${esc(x.label || '')}</p>${x.title ? `<${sectionTag}>${esc(x.title)}</${sectionTag}>` : ''}`;
      switch (x.type) {
        case 'chapters':
          return `<section class="g-sec">${head}${x.items.map(c => `
            <div class="g-ch"><b>${esc(c.y)}</b><${chapterTag}>${esc(c.h)}</${chapterTag}><p>${esc(c.p)}</p>${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : ''}</div>`).join('')}</section>`;
        case 'voices':
          return `<section class="g-sec">${head}<div class="g-voices">${x.items.map(v => `
            <div class="g-voice rel" data-slot="ГОЛОСОВОЕ: короткая запись близкого без фоновой музыки">
              <strong class="g-voice__n">${esc(v.n)}</strong>
              <p class="g-voice__caption">${v.src ? 'Синтезированный пример' : `Место для записи · ${esc(v.t)}`}</p>
              ${v.src ? `<audio aria-label="Поздравление: ${esc(v.n)}" src="${esc(v.src)}" controls preload="none"></audio>
              <details><summary>Текст поздравления</summary><p>${esc(v.transcript)}</p></details>` : ''}
            </div>`).join('')}</div></section>`;
        case 'letter':
          return `<section class="g-sec"><p class="g-label">${esc(x.label)}</p><div class="g-letter">${esc(x.text)}<div class="sign">${esc(x.sign)}</div></div></section>`;
        case 'gallery':
          return `<section class="g-sec">${head}<div class="g-gallery">${x.imgs.map(i => `<img src="${esc(i)}" alt="" loading="lazy">`).join('')}</div></section>`;
        case 'count': {
          const d = Math.floor((Date.now() - new Date(x.from).getTime()) / 864e5);
          return `<section class="g-sec"><div class="g-count"><b>${nf(d)}</b><span>${esc(x.unit)}<br>${esc(x.note)}</span></div></section>`;
        }
        case 'reasons':
          return `<section class="g-sec">${head}<div class="g-reasons" data-reasons>${x.items.map((r, i) => `
            <div class="g-reason" style="z-index:${x.items.length - i};transform:rotate(${(i % 2 ? 1 : -1) * Math.min(i, 3)}deg)"><p>${esc(r)}</p><small>${i + 1} из ${x.items.length} · нажмите, чтобы открыть следующую</small></div>`).join('')}</div></section>`;
        case 'quiz':
          return `<section class="g-sec">${head}<div class="g-quiz" data-quiz="${x.ok}"><p>${esc(x.q)}</p>${x.opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join('')}<small>${esc(x.note)}</small></div></section>`;
        case 'recipe':
          return `<section class="g-sec">${head}<div class="g-recipe"><ol>${x.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div></section>`;
        case 'premExtra':
          return `<section class="g-sec"><div class="g-prem-extra rel" data-slot="ВИДЕО 30-60 с или оживление фото для тарифа Премиум"><p class="g-label">${esc(x.label)}</p><${chapterTag}>${esc(x.title)}</${chapterTag}><p>${esc(x.text)}</p></div></section>`;
        case 'final':
          return `<section class="g-final"><${sectionTag}>${esc(x.title)}</${sectionTag}><p>${esc(x.text)}</p></section>`;
      }
      return '';
    }).join('');

    const poweredHref = standalone ? 'index.html#request' : (SPA ? '#home' : '#request');
    const powered = `<div class="g-powered"><span>Сделано в Поводе</span><a href="${poweredHref}" data-cta="viral-footer">Собрать подарок для близких</a></div>`;

    return `<div class="g-cover rel" data-slot="ОБЛОЖКА: фото или видео 9:16 героя/пары, 5-8 с, луп"><img src="${esc(g.cover.img)}" alt="">
      <div class="g-cover__copy"><small>${esc(g.cover.small)}</small><${coverTag}>${esc(g.cover.title)}</${coverTag}><p>${esc(g.cover.sub)}</p></div></div>${missingHint}${s}${powered}`;
  };

  const pauseAudio = (root, current) => $$('audio', root).forEach(audio => {
    if (audio !== current) audio.pause();
  });
  document.addEventListener('play', e => {
    if (e.target instanceof HTMLAudioElement) {
      pauseAudio(document, e.target);
      track('play_voice', { src: e.target.getAttribute('src') || '' });
    }
  }, true);
  addEventListener('pagehide', () => pauseAudio(document));

  const bindGift = root => {
    if (!root || root.hasAttribute('data-gift-bound')) return;
    root.setAttribute('data-gift-bound', '');
    root.addEventListener('click', e => {
      const box = e.target.closest('[data-reasons]');
      if (box) {
        const cards = $$('.g-reason', box);
        let idx = Number(box.dataset.idx || 0);
        if (idx < cards.length - 1) {
          cards[idx].classList.add('is-out');
          idx++;
        } else {
          cards.forEach(c => c.classList.remove('is-out'));
          idx = 0;
        }
        box.dataset.idx = String(idx);
        track('reasons_step', { idx });
        return;
      }
      const qBtn = e.target.closest('[data-quiz] button');
      if (qBtn) {
        const q = qBtn.closest('[data-quiz]');
        const ok = +q.dataset.quiz;
        $$('button', q).forEach(x => x.classList.remove('ok', 'no'));
        qBtn.classList.add(+qBtn.dataset.i === ok ? 'ok' : 'no');
        if (+qBtn.dataset.i !== ok) $$('button', q)[ok]?.classList.add('ok');
        track('quiz_answer', { correct: +qBtn.dataset.i === ok });
      }
    });
  };

  const giftStory = $('#giftStory');
  if (giftStory) {
    giftStory.innerHTML = gift(OCCASIONS[occKey].gift, true, 'story');
    bindGift(giftStory);
    return;
  }

  const planCard = k => {
    const p = PLANS[k];
    return `<div class="plan${p.main ? ' plan--main' : ''}">${p.main ? '<span class="plan__badge">Рекомендуем</span>' : ''}
      <h3>${esc(p.name)}</h3><p class="plan__price">${esc(p.price)}</p><p class="plan__for">${esc(p.for)}</p>
      <p class="plan__anchor">${esc(p.anchor)}</p>
      <ul>${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <a class="btn ${p.main ? 'btn--acc' : 'btn--line'}" href="#request" data-plan="${esc(k)}" data-cta="plan-${esc(k)}">Выбрать «${esc(p.name)}»</a></div>`;
  };

  /* рендер общих блоков главной */
  const occGrid = $('#occGrid');
  if (occGrid) occGrid.innerHTML = ORDER.map(card).join('');

  const hubPrices = $('#hubPrices');
  if (hubPrices) hubPrices.innerHTML = ['mini', 'story', 'prem'].map(planCard).join('');

  const exchangeGrid = $('#exchangeGrid');
  if (exchangeGrid && GROWTH_COPY?.exchange) {
    const ex = GROWTH_COPY.exchange;
    exchangeGrid.innerHTML = `
      <div class="exchange__col">
        <h3>${esc(ex.inputTitle)}</h3>
        <p class="exchange__sub">${esc(ex.inputSub)}</p>
        <ul>${ex.inputItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>
      <div class="exchange__col exchange__col--out">
        <h3>${esc(ex.outputTitle)}</h3>
        <p class="exchange__sub">${esc(ex.outputSub)}</p>
        <ul>${ex.outputItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`;
  }

  const inviteBox = $('#inviteBox');
  if (inviteBox && GROWTH_COPY?.friendInvite) {
    const inv = GROWTH_COPY.friendInvite;
    inviteBox.innerHTML = `
      <details>
        <summary>${esc(inv.title)}</summary>
        <p class="invite-box__hint">${esc(inv.hint)}</p>
        <p class="invite-box__text" id="inviteText">${esc(inv.text)}</p>
        <button type="button" class="btn btn--line-light btn--sm" id="copyInviteBtn">Скопировать текст для чата</button>
      </details>`;
    $('#copyInviteBtn')?.addEventListener('click', e => {
      copyText(inv.text, e.currentTarget, 'Скопировать текст для чата');
      track('copy_template', { kind: 'friend_invite' });
    });
  }

  const qrCardPreview = $('#qrCardPreview');
  if (qrCardPreview && GROWTH_COPY?.qrCard) {
    const q = GROWTH_COPY.qrCard;
    qrCardPreview.innerHTML = `
      <div class="qr-card-preview__copy">
        <p class="eyebrow">${esc(q.eyebrow)}</p>
        <h3>${esc(q.title)}</h3>
        <p>${esc(q.lead)}</p>
        <p class="qr-card-preview__note">${esc(q.priceNote)}</p>
      </div>
      <div class="qr-card-mock rel" data-slot="МАКЕТ ОТКРЫТКИ: фото реальной открытки с QR в конверте">
        <div class="qr-card-mock__code" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <strong>${esc(q.cardTitle)}</strong>
        <span>${esc(q.cardSub)}</span>
        <small>${esc(q.cardUrl)}</small>
      </div>`;
  }

  /* переключатель сценариев в Hero на главной */
  const heroTabs = $('#heroTabs');
  if (heroTabs) {
    let activeHero = 'jubilee';
    const updateHero = key => {
      activeHero = key;
      const o = OCCASIONS[key];
      const img = $('#heroStageImg');
      const title = $('#heroStageTitle');
      const sub = $('#heroStageSub');
      const media = $('#heroStageMedia');
      const btn = $('#heroDemoBtn');
      if (img) {
        img.src = o.img;
        img.alt = o.heroCaption;
      }
      if (title) title.textContent = o.heroCaption;
      if (sub) sub.textContent = o.heroSub;
      if (media) media.dataset.slot = o.heroSlot;
      if (btn) {
        if (key === 'jubilee') {
          btn.textContent = 'Открыть пример подарка';
          btn.href = SPA ? '#jubilee-demo' : 'jubilee-demo.html';
          btn.dataset.spaHref = '#jubilee-demo';
        } else {
          btn.textContent = `Смотреть пример: ${o.short}`;
          btn.href = SPA ? `#${key}` : `${key}.html#demo`;
          btn.dataset.spaHref = `#${key}`;
        }
      }
      $$('.hero-tab', heroTabs).forEach(b => {
        const on = b.dataset.hero === key;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };

    heroTabs.innerHTML = HERO_ORDER.map(k => `
      <button type="button" class="hero-tab" role="tab" data-hero="${k}">${esc(OCCASIONS[k].tabLabel)}</button>`).join('');
    heroTabs.addEventListener('click', e => {
      const btn = e.target.closest('[data-hero]');
      if (!btn) return;
      updateHero(btn.dataset.hero);
      track('hero_switch', { occasion: activeHero });
    });
    updateHero('jubilee');
  }

  /* мягкий лид-магнит (7 вопросов для старта) в блоке заявки */
  const interviewGuide = $('#interviewGuide');
  if (interviewGuide && GROWTH_COPY?.interviewQuestions) {
    const q = GROWTH_COPY.interviewQuestions;
    interviewGuide.innerHTML = `
      <details class="soft-cta__box">
        <summary>${esc(q.title)}</summary>
        <p class="soft-cta__hint">${esc(q.hint)}</p>
        <ol class="soft-cta__list">${q.items.map(i => `<li>${esc(i.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>
        <button type="button" class="btn btn--line-light btn--sm" id="copyGuideBtn">Скопировать вопросы себе</button>
      </details>`;
    $('#copyGuideBtn')?.addEventListener('click', e => {
      copyText(q.items.join('\n'), e.currentTarget, 'Скопировать вопросы себе');
      track('copy_template', { kind: 'interview_questions' });
    });
  }

  /* страница повода */
  const page = $('#page');
  let full = null;
  const openFull = () => {
    if (!full) return;
    pauseAudio(page);
    full.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('#closeFull')?.focus({ preventScroll: true });
    track('open_full_demo', { occasion: document.body.dataset.occasion || '' });
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
    const defaultTier = o.plans.includes(o.demoPlan) ? o.demoPlan : o.plans[0];
    closeFull();
    pauseAudio(page);
    document.body.dataset.occasion = key;
    if (SPA || key !== 'jubilee') document.title = o.seoTitle || `${o.name} - сайт-подарок | Повод`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && o.seoDesc) metaDesc.setAttribute('content', o.seoDesc);

    page.innerHTML = `
    <section class="ohero">
      <div class="wrap ohero__spread">
        <div class="ohero__in">
          <p class="eyebrow">${esc(o.name)}</p>
          <h1>${esc(o.title)}</h1>
          <p class="ohero__lead">${esc(o.lead)}</p>
          <div class="ohero__actions">
            <a class="btn btn--acc" href="${key === 'jubilee' && !SPA ? 'jubilee-demo.html' : '#demo'}" data-cta="occ-demo">Посмотреть пример</a>
            <a class="btn btn--line" href="#oprices" data-cta="occ-prices">Цены ${esc(o.from)}</a>
          </div>
        </div>
        <div class="ohero__media rel" data-slot="${esc(o.heroSlot)}"><img src="${esc(o.img)}" alt=""></div>
      </div>
    </section>

    <section class="sec sec--example" id="demo">
      <div class="wrap demo">
        <div class="demo__text">
          <p class="eyebrow">Пример подарка</p>
          <h2>${esc(o.demoTitle)}</h2>
          ${o.demoText.map(t => `<p>${esc(t)}</p>`).join('')}
          <div class="tier-switch" id="tierSwitch" role="group" aria-label="Сравнить комплектацию тарифа">
            ${o.plans.map(pk => `<button type="button" class="tier-pill${pk === defaultTier ? ' is-on' : ''}" data-tier="${pk}">${esc(PLANS[pk].name)} · ${esc(PLANS[pk].price)}</button>`).join('')}
          </div>
          <p class="tier-note" id="tierNote"></p>
          <ul class="demo__list">${o.demoList.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="demo__actions">
            <button type="button" class="btn btn--ink" id="openFull">Открыть пример на весь экран</button>
            <a class="btn btn--acc" href="#request" id="demoOrderBtn" data-plan="${defaultTier}" data-cta="demo-order">Выбрать «${esc(PLANS[defaultTier].name)}»</a>
          </div>
        </div>
        <div class="demo__display">
          <div class="phone"><div class="phone__screen"><div class="gift" id="giftPhone"></div><span class="phone__hint" id="phoneHint">Листайте внутри телефона</span></div></div>
        </div>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><h2>Из чего собираем подарок</h2></div>
        <ul class="inside">${o.inside.map(i => `<li><b>${esc(i.b)}</b><span>${esc(i.s)}</span></li>`).join('')}</ul>
      </div>
    </section>

    <section class="sec sec--pricing" id="oprices">
      <div class="wrap">
        <div class="sec__head"><h2>Форматы подарка</h2><p class="sec__lead">Цена фиксируется до начала работы. Размещение на год включено, продление 290 ₽ в год.</p></div>
        <div class="plans">${o.plans.map(planCard).join('')}</div>
        <p class="plans__extra">${esc(o.extra)}</p>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><h2>Как соберём ваш подарок</h2></div>
        <ol class="steps">${o.steps.map(s => `<li><b>${esc(s.b)}</b><p>${esc(s.p)}</p></li>`).join('')}</ol>
      </div>
    </section>

    <section class="sec" id="ofaq">
      <div class="wrap faq">
        <div class="sec__head"><h2>Вопросы о подарке</h2></div>
        <div>${o.faq.map((f, i) => `<details${i ? '' : ' open'}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
      </div>
    </section>

    <section class="sec sec--bg2">
      <div class="wrap">
        <div class="sec__head"><h2>Другие поводы</h2></div>
        <div class="others">${ORDER.filter(k => k !== key).map(card).join('')}</div>
      </div>
    </section>`;

    if (full) full.parentNode.removeChild(full);
    full = document.createElement('div');
    full.className = 'gift-full';
    full.innerHTML = `<button type="button" class="gift-full__close" id="closeFull">Закрыть пример</button><div class="gift" id="giftFull"></div>`;
    document.body.appendChild(full);

    const setTier = tierKey => {
      const phone = $('#giftPhone');
      const fullGift = $('#giftFull');
      if (phone) {
        phone.removeAttribute('data-gift-bound');
        phone.innerHTML = gift(o.gift, false, tierKey);
        phone.scrollTop = 0;
        bindGift(phone);
      }
      if (fullGift) {
        fullGift.removeAttribute('data-gift-bound');
        fullGift.innerHTML = gift(o.gift, false, tierKey);
        fullGift.scrollTop = 0;
        bindGift(fullGift);
      }
      $$('#tierSwitch .tier-pill', page).forEach(b => b.classList.toggle('is-on', b.dataset.tier === tierKey));
      const note = $('#tierNote');
      if (note) note.textContent = PLANS[tierKey].anchor;
      const orderBtn = $('#demoOrderBtn');
      if (orderBtn) {
        orderBtn.dataset.plan = tierKey;
        orderBtn.textContent = `Выбрать «${PLANS[tierKey].name}»`;
      }
    };

    setTier(defaultTier);
    $('#tierSwitch')?.addEventListener('click', e => {
      const b = e.target.closest('[data-tier]');
      if (!b) return;
      setTier(b.dataset.tier);
      track('switch_tier_preview', { occasion: key, tier: b.dataset.tier });
    });

    $('#openFull').addEventListener('click', openFull);
    $('#closeFull').addEventListener('click', closeFull);
    full.addEventListener('click', e => { if (e.target === full) closeFull(); });
    $('#giftPhone').addEventListener('scroll', () => { $('#phoneHint').style.opacity = 0; }, { once: true });

    const sel = $('#occSelect');
    if (sel) sel.value = key;
    const requestedPlan = new URLSearchParams(location.search).get('plan');
    const planSelect = $('#planSelect');
    if (!SPA && planSelect && o.plans.includes(requestedPlan)) planSelect.value = requestedPlan;
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
      } else if (!h || h === 'home') {
        showHub();
        scrollTo(0, 0);
      } else if (hub.hidden && hub.querySelector('#' + CSS.escape(h))) {
        showHub();
        document.getElementById(h).scrollIntoView();
      }
    };
    addEventListener('hashchange', route);
    route();
  }

  /* форма по контракту POST /api/request, проверка дедлайна и предвыбор */
  document.addEventListener('click', e => {
    const ctaEl = e.target.closest('[data-cta]');
    if (ctaEl) lastCta = ctaEl.dataset.cta;

    const planLink = e.target.closest('[data-plan]');
    const planSel = $('#planSelect');
    if (planLink && planSel && Object.hasOwn(PLANS, planLink.dataset.plan)) {
      planSel.value = planLink.dataset.plan;
      track('pick_plan', { plan: planLink.dataset.plan, from: lastCta });
    }

    const occPick = e.target.closest('[data-occasion-pick]');
    const occSel = $('#occSelect');
    if (occPick && occSel) {
      occSel.value = occPick.dataset.occasionPick;
      track('pick_occasion', { occasion: occPick.dataset.occasionPick });
    }
  });

  const MONTHS = {
    'январ': 0, 'феврал': 1, 'март': 2, 'апрел': 3, 'ма': 4, 'июн': 5,
    'июл': 6, 'август': 7, 'сентябр': 8, 'октябр': 9, 'ноябр': 10, 'декабр': 11
  };
  const parseDateText = raw => {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const ruNum = s.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
    if (ruNum) {
      const y = ruNum[3] ? (+ruNum[3] < 100 ? 2000 + +ruNum[3] : +ruNum[3]) : new Date().getFullYear();
      const d = new Date(y, +ruNum[2] - 1, +ruNum[1]);
      if (!ruNum[3] && d < new Date().setHours(0, 0, 0, 0)) d.setFullYear(y + 1);
      return d;
    }
    const ruWord = s.match(/(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?/);
    if (ruWord) {
      const mKey = Object.keys(MONTHS).find(k => ruWord[2].startsWith(k));
      if (mKey) {
        const y = ruWord[3] ? +ruWord[3] : new Date().getFullYear();
        const d = new Date(y, MONTHS[mKey], +ruWord[1]);
        if (!ruWord[3] && d < new Date().setHours(0, 0, 0, 0)) d.setFullYear(y + 1);
        return d;
      }
    }
    return null;
  };

  const form = $('#form');
  if (form) {
    const channelMeta = {
      telegram: { label: 'Ваш ник или номер в Telegram', placeholder: '@nik или +7 ...' },
      phone: { label: 'Номер телефона', placeholder: '+7 900 000-00-00' },
      whatsapp: { label: 'Номер в WhatsApp', placeholder: '+7 900 000-00-00' }
    };

    $('#channelPills')?.addEventListener('click', e => {
      const b = e.target.closest('[data-channel]');
      if (!b) return;
      const ch = b.dataset.channel;
      $$('#channelPills .ch-pill').forEach(x => x.classList.toggle('is-on', x === b));
      $('#channelInput').value = ch;
      const meta = channelMeta[ch];
      if (meta) {
        $('#contactLabel').textContent = meta.label;
        $('#contactInput').placeholder = meta.placeholder;
      }
      track('switch_channel', { channel: ch });
    });

    const dateInput = $('#dateInput');
    const datePicker = $('#datePicker');
    const dateStatus = $('#dateStatus');
    const updateDateStatus = () => {
      if (!dateStatus || !dateInput) return;
      const parsed = parseDateText(dateInput.value);
      dateStatus.className = 'date-status';
      if (!dateInput.value.trim()) {
        dateStatus.textContent = 'Укажите дату - подскажем, успеваем ли спокойно или нужен срочный тариф.';
        return;
      }
      if (!parsed || Number.isNaN(parsed.getTime())) {
        dateStatus.textContent = 'Дату зафиксируем в заявке и сразу согласуем срок в переписке.';
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.round((parsed.getTime() - today.getTime()) / 864e5);
      if (diff < 0) {
        dateStatus.classList.add('is-warn');
        dateStatus.textContent = 'Эта дата уже прошла - проверьте год или напишите актуальную дату.';
      } else if (diff <= 1) {
        dateStatus.classList.add('is-rush');
        dateStatus.textContent = 'До праздника меньше 2 дней: успеем «Мини» к утру или срочный запуск за 24 часа (+1 000 ₽).';
      } else if (diff <= 3) {
        dateStatus.classList.add('is-rush');
        dateStatus.textContent = `Осталось ${diff} дн.: спокойно успеваем «Мини» (2 дня), «Историю» запустим в ускоренном режиме.`;
      } else {
        dateStatus.classList.add('is-ok');
        dateStatus.textContent = `До праздника ${diff} дн. - спокойно успеваем любой формат с запасом на правки.`;
      }
    };

    datePicker?.addEventListener('change', () => {
      if (datePicker.value) {
        dateInput.value = datePicker.value;
        updateDateStatus();
      }
    });
    dateInput?.addEventListener('input', updateDateStatus);

    let formStarted = false;
    form.addEventListener('focusin', () => {
      if (formStarted) return;
      formStarted = true;
      track('form_start', { occasion: $('#occSelect')?.value || '', plan: $('#planSelect')?.value || '' });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const note = $('#formNote');
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const contact = String(fd.get('contact') || '').trim();
      const about = String(fd.get('about') || '').trim();
      const date = String(fd.get('date') || '').trim();
      const website = String(fd.get('website') || '').trim();
      const consent = $('#consentCheck')?.checked;
      const occasion = String(fd.get('occasion') || 'custom');
      const plan = String(fd.get('plan') || 'unknown');
      const contactChannel = String(fd.get('contactChannel') || 'telegram');

      note.className = 'form__note';
      if (website) {
        note.textContent = 'Демо-заявка отклонена проверкой.';
        return;
      }
      if (name.length < 1 || name.length > 80) {
        note.classList.add('is-err');
        note.textContent = 'Укажите имя (от 1 до 80 символов).';
        form.elements.name.focus();
        return;
      }
      if (contact.length < 3 || contact.length > 100) {
        note.classList.add('is-err');
        note.textContent = 'Укажите телефон или @ник (от 3 до 100 символов).';
        form.elements.contact.focus();
        return;
      }
      if (about.length > 1000) {
        note.classList.add('is-err');
        note.textContent = 'Комментарий не должен быть длиннее 1 000 символов.';
        return;
      }
      if (!consent) {
        note.classList.add('is-err');
        note.textContent = 'Подтвердите согласие на обработку персональных данных.';
        $('#consentCheck')?.focus();
        return;
      }

      const utm = {};
      new URLSearchParams(location.search).forEach((v, k) => {
        if (k.startsWith('utm_')) utm[k] = v;
      });
      const payload = {
        brand: 'povod',
        name,
        contact,
        contactChannel,
        plan,
        occasion,
        date,
        about,
        consent: true,
        website: '',
        meta: { cta: lastCta, utm }
      };
      track('form_submit_demo', payload);
      const planTitle = PLANS[plan]?.name || 'Пока не знаю';
      const occTitle = OCCASIONS[occasion]?.short || 'Свой повод';
      note.classList.add('is-ok');
      note.textContent = `Демо-заявка проверена (${occTitle}, формат «${planTitle}», канал: ${contactChannel}). Это макет - реальная отправка в Telegram подключится на сервере.`;
    });
  }
})();
