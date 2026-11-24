/* Повод v2 - нативная прокрутка, один цикл requestAnimationFrame. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const ORDER = ['wedding', 'birthday', 'anniversary', 'jubilee'];
  const main = $('#main');
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mq.matches;
  const inlineAssets = window.POVOD_ASSETS || {};
  const src = p => inlineAssets[p] || p;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const image = (path, alt = '', lazy = true) => '<img src="' + src(path) + '" alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
  let currentRoute = 'home', activeSlide = 0, slideAt = performance.now(), transition = null;
  let slides = [], hero = null, cloud = null, sceneLayers = [], progress = null, orbit = null;
  let pendingFlight = null, lastScroll = -1, frameNow = 0, returnFocus = null;
  const slotsControl = $('#slotsToggle');
  let slotObstacles = [], slotsDirty = true, slotsTrackUntil = 0;
  const visibleVideos = new Set();
  const videoPaths = new Set(Object.keys(inlineAssets).filter(p => p.endsWith('.mp4')));
  let videoReady = Object.keys(inlineAssets).length > 0;
  const viewport = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visibleVideos.add(e.target); else visibleVideos.delete(e.target);
      syncVideo(e.target);
    });
  }, { threshold: .05 });
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-seen'); reveal.unobserve(e.target);
        slotsTrackUntil = performance.now() + 1500;
      }
    });
  }, { threshold: .12 });

  function visual(name, path, slot, extra = '') {
    const preload = /^(slide-|story-)/.test(name || '') ? 'metadata' : 'none';
    return '<div class="visual ' + extra + '" data-slot="' + esc(slot) + '">' +
      image(path, '', false) + (name ? '<video muted loop playsinline preload="' + preload + '" poster="' + src(path) + '" data-video="assets/v2/video/' + name + '.mp4" aria-hidden="true"></video>' : '') + '</div>';
  }
  function syncVideo(v) {
    const path = v.dataset.video;
    if (!v.hasAttribute('src') && videoReady && videoPaths.has(path)) {
      v.src = src(path);
      v.muted = true;
    }
    const slide = v.closest('.hero-slide');
    const allowed = !reduced && !document.hidden && visibleVideos.has(v) && (!slide || slide.classList.contains('is-active') || slide.classList.contains('is-incoming'));
    if (!allowed) { v.pause(); return; }
    if (v.hasAttribute('src') && v.paused) v.play().catch(() => {});
  }
  function syncAllVideos() { $$('video').forEach(syncVideo); }
  async function discoverVideo() {
    if (videoReady) return;
    // Проверяем каталог, а не отсутствующие mp4: нет запросов с 404.
    try {
      const r = await fetch('assets/v2/video/', { cache: 'no-store' });
      if (r.ok) {
        const html = new DOMParser().parseFromString(await r.text(), 'text/html');
        $$('a[href]', html).forEach(a => {
          const name = decodeURIComponent(a.getAttribute('href').split('/').pop());
          if (/^[a-z0-9-]+\.mp4$/.test(name)) videoPaths.add('assets/v2/video/' + name);
        });
      }
    } catch (_) { /* Локальный файл без каталога использует постеры. */ }
    videoReady = true;
    syncAllVideos();
  }
  function hydrate() {
    $$('.reveal,.comic', main).forEach(el => reveal.observe(el));
    $$('video', main).forEach(v => {
      v.addEventListener('error', () => { v.pause(); v.style.visibility = 'hidden'; });
      viewport.observe(v);
    });
    slotObstacles = $$('.btn,.occasion-hero__bottom,.hero-footer,.thumb-label,.card-caption,.comic,.phone,.phone-hint,.demo-caption', main);
    slotsDirty = true;
    syncSlotsControl();
  }
  function syncSlotsControl() {
    const b = slotsControl.getBoundingClientRect();
    const blocked = slotObstacles.some(el => {
      const thumb = el.closest('.thumb');
      if (thumb && !thumb.classList.contains('is-active')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left < b.right + 8 && r.right > b.left - 8 && r.top < b.bottom + 8 && r.bottom > b.top - 8;
    });
    slotsControl.classList.toggle('is-occluded', blocked);
    slotsControl.setAttribute('aria-hidden', String(blocked));
    slotsControl.tabIndex = blocked ? -1 : 0;
    slotsDirty = false;
  }
  function card(k, i = 0) {
    const o = OCCASIONS[k];
    return '<a class="occasion-card reveal" style="--delay:' + i * 90 + 'ms" href="#' + k + '" data-occasion="' + k + '" data-slot="Карточка ' + esc(o.short) + ': фото 3:4">' +
      image('assets/v2/scenes/slide-' + k + '.jpg', o.short) +
      '<div class="card-caption"><h3>' + o.short + '</h3><span>' + o.from + '</span></div></a>';
  }
  function plans(keys) {
    return '<div class="plans' + (keys.length === 2 ? ' plans--two' : '') + '">' + keys.map(k => {
      const p = PLANS[k];
      return '<article class="plan reveal' + (p.main ? ' plan--main' : '') + '">' +
        (p.main ? '<span class="plan-badge">Чаще выбирают</span>' : '') +
        '<h3>' + p.name + '</h3><p class="plan-price">' + p.price + '</p><p class="plan-for">' + p.for + '</p><ul>' +
        p.items.map(t => '<li>' + t + '</li>').join('') + '</ul><a class="btn ' + (p.main ? '' : 'btn--line') + '" href="#request" data-scroll="request" data-plan="' + p.name + '">Выбрать «' + p.name + '»</a></article>';
    }).join('') + '</div>';
  }
  function priceSection(o) {
    return '<section class="section" id="prices"><div class="wrap"><div class="section-head split-head"><div><p class="eyebrow">Цены</p><h2>Выберите формат</h2></div><p class="lead">' +
      HUB.prices + '</p></div>' + plans(o ? o.plans : ['mini', 'story', 'prem']) + '<p class="plans-extra">' + (o ? o.extra : HUB.extra) + '</p></div></section>';
  }
  function howSection(o) {
    return '<section class="section" id="how"><div class="wrap"><div class="section-head"><p class="eyebrow">Как это работает</p><h2>От вас истории,<br>от нас всё остальное</h2></div><ol class="steps">' +
      (o ? o.steps : HUB.steps).map((s, i) => '<li class="reveal" style="--delay:' + i * 120 + 'ms"><b>' + s.b + '</b><p>' + s.p + '</p></li>').join('') + '</ol></div></section>';
  }
  function faqSection(o) {
    return '<section class="section"><div class="wrap faq"><div><p class="eyebrow">Вопросы</p><h2>Что обычно спрашивают</h2></div><div>' +
      (o ? o.faq : HUB.faq).map((f, i) => '<details' + (!i ? ' open' : '') + '><summary>' + f.q + '</summary><p>' + f.a + '</p></details>').join('') + '</div></div></section>';
  }
  function requestSection(key) {
    return '<section class="request-section" id="request"><div class="wrap request"><div><p class="eyebrow">Заявка</p><h2>Расскажите, кого<br>и с чем поздравляем</h2><p class="lead">Ответим в течение часа в рабочее время, подскажем идею и назовём точную цену.</p></div>' +
      '<form class="form" id="form"><label>Как к вам обращаться<input name="name" autocomplete="given-name" maxlength="80" required placeholder="Аня"></label><label>Телефон или Telegram<input name="contact" maxlength="120" required placeholder="+7 ... или @ник"></label>' +
      '<label>Повод<select name="occasion" id="occSelect">' + ORDER.map(k => '<option' + (k === key ? ' selected' : '') + '>' + OCCASIONS[k].name + '</option>').join('') + '<option>Свой повод</option></select></label>' +
      '<label>Формат<select name="plan" id="planSelect"><option>Пока не знаю</option>' + Object.values(PLANS).map(p => '<option>' + p.name + '</option>').join('') + '</select></label>' +
      '<label class="wide">Когда праздник<input name="date" maxlength="100" placeholder="Например, 14 марта"></label><button class="btn btn--accent" type="submit">Отправить заявку</button>' +
      '<p class="form-note" id="formNote" role="status">Это макет: заявка не отправляется, данные никуда не передаются.</p></form></div></section>';
  }
  function insideSection(o) {
    return '<section class="section"><div class="wrap"><div class="section-head"><p class="eyebrow">Что внутри</p><h2>Из чего собираем подарок</h2></div><ul class="inside">' +
      o.inside.map((x, i) => '<li class="reveal" style="--delay:' + (i % 3) * 120 + 'ms"><b>' + x.b + '</b><span>' + x.s + '</span></li>').join('') + '</ul></div></section>';
  }
  function heroTitle(k) {
    return V2[k].title.map((w, i) => '<span class="word-mask"><span class="hero-word" style="--i:' + i + '">' + w + '</span></span>').join('');
  }
  function renderHome() {
    main.innerHTML = '<section class="hero" id="hero" aria-label="Сайт-подарок к вашему поводу"><div class="hero-slides">' +
      ORDER.map((k, i) => '<div class="hero-slide' + (!i ? ' is-active' : '') + '" data-slide="' + k + '" style="--hero-fill:url(' + src('assets/v2/scenes/slide-' + k + '.jpg') + ')" aria-hidden="' + Boolean(i) + '">' +
      visual('slide-' + k, 'assets/v2/scenes/slide-' + k + '.jpg', 'Герой ' + k + ': видео 16:9, петля 10 с') + '</div>').join('') +
      '</div><div class="hero-shade"></div><div class="curtain-fog" id="curtainFog"></div><div class="hero-content"><p class="eyebrow">Сайт-подарок</p><h1 class="hero-title" id="heroTitle">' + heroTitle('wedding') + '</h1>' +
      '<div class="actions hero-actions"><a class="btn" href="#request" data-scroll="request">Собрать подарок</a><a class="btn btn--light" id="heroExample" href="#wedding">Смотреть пример</a></div></div>' +
      '<div class="hero-dots" aria-label="Выберите слайд"><div class="orbit" id="orbit" aria-hidden="true"><span class="rail-link"></span></div>' + ORDER.map((k, i) => '<button class="thumb' + (!i ? ' is-active' : '') + '" data-slide-button="' + i + '" aria-label="' + OCCASIONS[k].short + '" aria-pressed="' + !i + '">' +
      '<span class="thumb-photo" data-slot="Миниатюра ' + k + ': фото 1:1">' + image('assets/v2/thumbs/' + k + '.jpg', '', false) + '</span><span class="thumb-label"><b>' + OCCASIONS[k].short + '</b><small>' + OCCASIONS[k].card + '</small></span></button>').join('') + '</div>' +
      '<div class="hero-footer"><p>Ваши люди.<br>Ваши истории.<br>Один особенный подарок.</p><div class="slide-status"><span id="slideNumber">01</span><span class="progress"><i id="slideProgress"></i></span><span>04</span></div></div>' +
      '<div class="clouds" id="clouds">' + visual('clouds', 'assets/v2/scenes/clouds.jpg', 'Облака: видео screen или JPG на чёрном') + '</div></section>' +
      '<section class="occasions" id="occasions"><div class="wrap"><div class="section-head split-head"><div><p class="eyebrow">Для тех, кто вам дорог</p><h2>Выберите повод</h2></div><p class="occasions-note">У каждой истории<br>свой особенный день</p></div><div class="occasion-grid">' +
      ORDER.map(card).join('') + '<a class="occasion-card occasion-card--own reveal" style="--delay:360ms" href="#request" data-scroll="request" data-own><span class="own-title">Свой<br>повод</span><div><div class="own-line"></div><p>' + HUB.other + '</p></div></a></div></div></section>' +
      '<section class="section"><div class="wrap intro"><div><p class="eyebrow">Больше, чем подарок</p><p class="intro-aside">' + HUB.note + '<span></span></p></div><div class="reveal"><h2>' + HUB.title + '</h2><p class="lead">' + HUB.lead + '</p></div></div></section>' +
      demoSection('wedding') + insideSection(OCCASIONS.wedding) + howSection(null) + priceSection(null) + faqSection(null) + requestSection(null);
    activeSlide = 0; slideAt = performance.now(); transition = null;
    hero = $('#hero'); cloud = $('#clouds'); slides = $$('.hero-slide'); progress = $('#slideProgress'); orbit = $('#orbit');
    sceneLayers = [];
  }
  const bars = (n, seed) => Array.from({length:n}, (_, i) => '<i style="height:' + Math.round(25 + 75 * Math.abs(Math.sin(i * .7 + seed) * Math.cos(i * .23 + seed * 2))) + '%"></i>').join('');
  function gift(g) {
    return '<div class="g-cover" data-slot="Обложка примера: фото 9:16">' + image(g.cover.img, g.cover.title, false) + '<small>' + g.cover.small + '</small><h3>' + g.cover.title + '</h3><p>' + g.cover.sub + '</p></div>' +
      g.sections.map(x => {
        const head = '<p class="g-label">' + (x.label || '') + '</p>' + (x.title ? '<h4>' + x.title + '</h4>' : '');
        let body = '';
        switch (x.type) {
          case 'chapters': body = head + x.items.map(c => '<div class="g-ch"><b>' + c.y + '</b><h5>' + c.h + '</h5><p>' + c.p + '</p>' + (c.img ? '<div data-slot="Фото главы: ' + esc(c.h) + '">' + image(c.img, c.h) + '</div>' : '') + '</div>').join(''); break;
          case 'voices': body = head + x.items.map((v, i) => '<button class="g-voice" data-voice data-slot="Голосовое: ' + esc(v.n) + '"><span class="voice-label">Слушать</span><span class="voice-copy"><b>' + v.n + '</b><span class="voice-bars">' + bars(26, i + 1) + '</span></span><span class="vtime">' + v.t + '</span></button>').join('') + '<p class="voice-note" role="status">Демонстрация плеера. Записи в макет не добавлены.</p>'; break;
          case 'letter': body = head + '<div class="g-letter">' + x.text + '<div class="sign">' + x.sign + '</div></div>'; break;
          case 'gallery': body = head + '<div class="g-gallery">' + x.imgs.map((p, i) => '<div data-slot="Фото галереи ' + (i + 1) + '">' + image(p, 'Фото из истории') + '</div>').join('') + '</div>'; break;
          case 'count': body = '<div class="g-count"><b>' + Math.max(0, Math.floor((Date.now() - new Date(x.from).getTime()) / 86400000)).toLocaleString('ru-RU') + '</b><span>' + x.unit + '<br>' + x.note + '</span></div>'; break;
          case 'reasons': body = head + '<div class="g-reasons" data-reasons>' + x.items.map((r, i) => '<button class="g-reason" ' + (i ? 'tabindex="-1" aria-hidden="true"' : '') + ' style="z-index:' + (x.items.length - i) + ';transform:rotate(' + (i % 2 ? 1 : -1) * Math.min(i, 3) + 'deg)"><p>' + r + '</p><small>' + (i + 1) + ' из ' + x.items.length + ' · нажмите, чтобы открыть следующую</small></button>').join('') + '</div>'; break;
          case 'quiz': body = head + '<div class="g-quiz" data-quiz="' + x.ok + '"><p>' + x.q + '</p>' + x.opts.map((t, i) => '<button data-answer="' + i + '">' + t + '</button>').join('') + '<small>' + x.note + '</small><p class="quiz-result" role="status"></p></div>'; break;
          case 'recipe': body = head + '<div class="g-recipe"><ol>' + x.steps.map(t => '<li>' + t + '</li>').join('') + '</ol></div>'; break;
          case 'final': return '<section class="g-final" data-block="final"><h4>' + x.title + '</h4><p>' + x.text + '</p></section>';
        }
        return '<section class="g-sec" data-block="' + x.type + '">' + body + '</section>';
      }).join('');
  }
  function demoSection(k) {
    const o = OCCASIONS[k];
    return '<section class="section" id="demo"><div class="wrap demo"><div class="demo-text"><p class="eyebrow">Живой пример · Вымышленная история</p><h2>' + o.demoTitle + '</h2>' +
      o.demoText.map(t => '<p class="lead">' + t + '</p>').join('') + '<ul class="demo-list">' + o.demoList.map(t => '<li>' + t + '</li>').join('') + '</ul><button class="btn btn--line" data-open-gift="' + k + '">Открыть пример на весь экран</button></div>' +
      '<div class="demo-stage"><div class="phone"><div class="phone-screen"><div class="gift" id="giftPhone" tabindex="0" aria-label="Пример подарка. Листайте внутри телефона">' + gift(o.gift) + '</div></div></div><p class="phone-hint">Листайте внутри телефона</p><p class="demo-caption">Настоящие чувства. Ваши фотографии. Ваша ссылка.</p></div></div></section>';
  }
  function sceneData(k) {
    if (V2[k].scenes) return V2[k].scenes;
    const chapters = OCCASIONS[k].gift.sections.find(s => s.type === 'chapters').items;
    return chapters.map((c, i) => ({ media: V2[k].images[i], old: true, label: c.y + '. ' + c.h, lines: wrapLines(c.p) }));
  }
  function wrapLines(text) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(w => { if ((line + ' ' + w).length > 34 && line) { lines.push(line); line = w; } else line += (line ? ' ' : '') + w; });
    if (line) lines.push(line);
    return lines;
  }
  function renderOcc(k) {
    const o = OCCASIONS[k];
    main.innerHTML = '<section class="occasion-hero"><div class="occasion-cover">' + visual('slide-' + k, 'assets/v2/scenes/slide-' + k + '.jpg', 'Главный кадр ' + o.short) + '</div><div class="wrap occasion-hero__in"><p class="eyebrow">Сайт-подарок · ' + o.short + '</p><h1>' + o.title + '</h1><p class="lead">' + o.lead + '</p><div class="actions"><a class="btn" href="#demo" data-scroll="demo">Смотреть подарок</a><a class="btn btn--light" href="#prices" data-scroll="prices">Цены ' + o.from + '</a></div></div><div class="occasion-hero__bottom"><a href="#home">Все поводы</a><span>Листайте. История начинается.</span></div></section>' +
      '<div class="wrap story-intro"><h2>Большая история.<br>Ваши маленькие моменты.</h2><p>Пример того, как воспоминания становятся подарком.</p></div><div class="story-scenes">' +
      sceneData(k).map((s, i) => '<section class="story-scene" id="scene-' + (i + 1) + '" aria-label="' + esc(s.label) + '"><div class="scene-image">' + visual(s.old ? null : s.media, 'assets/' + (s.old ? 'img/' : 'v2/scenes/') + s.media + '.jpg', 'Сцена ' + (i + 1) + ': ' + s.media) +
      '</div><div class="scene-top"><span>' + s.label + '</span><span>0' + (i + 1) + ' / 04</span></div><div class="comic"><p class="comic-label">' + s.label + '</p>' +
      s.lines.map((line, j) => '<span class="comic-line"><span style="--i:' + j + '">' + line + '</span></span>').join('') + '</div></section>').join('') + '</div>' +
      demoSection(k) + insideSection(o) + priceSection(o) + howSection(o) + faqSection(o) + requestSection(k) +
      '<section class="section others" id="occasions"><div class="wrap"><div class="section-head"><p class="eyebrow">Другие поводы</p><h2>Ещё один повод<br>сказать о главном</h2></div><div class="occasion-grid">' + ORDER.filter(x => x !== k).map(card).join('') + '</div></div></section>';
    hero = null; slides = []; cloud = null; progress = null; orbit = null; transition = null;
    sceneLayers = $$('.scene-image');
  }

  function setSlide(index, now = performance.now()) {
    if (!hero || index === activeSlide) return;
    if (transition) finishSlide();
    const from = slides[activeSlide], to = slides[index];
    if (!from || !to) return;
    activeSlide = index; slideAt = now;
    if (reduced) {
      from.classList.remove('is-active'); from.setAttribute('aria-hidden', 'true');
      to.classList.add('is-active'); to.setAttribute('aria-hidden', 'false');
    } else {
      to.classList.add('is-incoming'); to.setAttribute('aria-hidden', 'false');
      transition = { from, to, start: now };
    }
    const k = ORDER[index];
    $('#heroTitle').innerHTML = heroTitle(k);
    $('#heroTitle').classList.toggle('long-title', k === 'anniversary');
    $('#heroTitle').classList.toggle('birthday-title', k === 'birthday');
    $('#heroExample').href = '#' + k;
    $('#slideNumber').textContent = '0' + (index + 1);
    $$('.thumb').forEach((b, i) => { b.classList.toggle('is-active', i === index); b.setAttribute('aria-pressed', String(i === index)); });
    slotsDirty = true;
    slotsTrackUntil = now + 900;
    const button = $$('.thumb')[index];
    orbit.style.transform = 'translateY(' + button.offsetTop + 'px)';
    syncAllVideos();
  }
  function finishSlide() {
    if (!transition) return;
    const {from, to} = transition;
    from.classList.remove('is-active'); from.setAttribute('aria-hidden', 'true');
    to.classList.remove('is-incoming'); to.classList.add('is-active'); to.style.maskPosition = ''; to.style.maskSize = ''; to.style.maskImage = '';
    $('.visual', to).style.transform = 'scale(1.04)';
    $('#curtainFog').style.opacity = '0';
    transition = null; syncAllVideos();
  }
  function rememberPosition() {
    history.replaceState(Object.assign({}, history.state, { y: scrollY }), '', location.href);
  }
  function route(restore = false) {
    const hash = decodeURIComponent(location.hash.slice(1));
    const key = ORDER.includes(hash) ? hash : 'home';
    if ($('#giftDialog').open) closeGift();
    reveal.disconnect(); viewport.disconnect(); visibleVideos.clear(); $$('video').forEach(v => v.pause());
    currentRoute = key;
    document.body.dataset.route = key;
    document.title = key === 'home' ? 'Повод - сайт-подарок с вашей историей' : OCCASIONS[key].name + ' - сайт-подарок | Повод';
    if (key === 'home') renderHome(); else renderOcc(key);
    const y = restore && history.state && Number.isFinite(history.state.y) ? history.state.y : 0;
    scrollTo({top:y,behavior:'instant'}); lastScroll = -1;
    hydrate(); closeMenu();
    if (pendingFlight && key !== 'home' && !reduced) {
      const flight = pendingFlight; pendingFlight = null;
      const dest = $('.occasion-cover').getBoundingClientRect();
      const node = document.createElement('img');
      node.src = flight.src; node.className = 'fly-photo'; node.alt = '';
      Object.assign(node.style, { left:flight.rect.left+'px', top:flight.rect.top+'px', width:flight.rect.width+'px', height:flight.rect.height+'px', borderRadius:'4px' });
      document.body.appendChild(node); document.body.classList.add('route-enter');
      const animation = node.animate([
        {left:flight.rect.left+'px',top:flight.rect.top+'px',width:flight.rect.width+'px',height:flight.rect.height+'px',borderRadius:'4px'},
        {left:dest.left+'px',top:dest.top+'px',width:dest.width+'px',height:dest.height+'px',borderRadius:'0px'}
      ], {duration:900,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      animation.finished.then(() => { node.remove(); document.body.classList.remove('route-enter'); }).catch(() => node.remove());
    } else pendingFlight = null;
    if (hash && !ORDER.includes(hash) && hash !== 'home') {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({behavior:'instant'});
    }
    if (!restore && key !== 'home') main.focus({preventScroll:true});
  }
  function navigate(key) {
    if (key === currentRoute) { scrollTo({top:0,behavior:reduced?'instant':'smooth'}); return; }
    rememberPosition(); history.pushState({y:0}, '', '#' + key); route();
  }
  function closeMenu() {
    $('#mobileMenu').hidden = true; $('#menuToggle').setAttribute('aria-expanded','false');
    $('#top').classList.toggle('is-solid', scrollY > innerHeight * .3);
  }
  function closeGift() {
    $('#giftDialog').close(); $('#giftFull').innerHTML = ''; document.body.classList.remove('modal-open');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll:true});
  }

  document.addEventListener('click', e => {
    const slideButton = e.target.closest('[data-slide-button]');
    if (slideButton) { setSlide(Number(slideButton.dataset.slideButton)); return; }
    const open = e.target.closest('[data-open-gift]');
    if (open) {
      returnFocus = open; $('#giftFull').innerHTML = gift(OCCASIONS[open.dataset.openGift].gift);
      $('#giftDialog').showModal(); document.body.classList.add('modal-open'); return;
    }
    const voice = e.target.closest('[data-voice]');
    if (voice) {
      const note = $('.voice-note', voice.parentNode);
      if (note) note.textContent = 'В макете нет аудиозаписи. В готовом подарке здесь будет голос близкого человека.';
      return;
    }
    const reason = e.target.closest('.g-reason:not(.is-out)');
    if (reason) {
      const cards = $$('.g-reason', reason.parentNode), index = cards.indexOf(reason);
      if (index < cards.length - 1) {
        reason.classList.add('is-out'); reason.tabIndex = -1; reason.setAttribute('aria-hidden','true');
        cards[index+1].tabIndex = 0; cards[index+1].setAttribute('aria-hidden','false'); cards[index+1].focus({preventScroll:true});
      } else {
        cards.forEach((c, i) => { c.classList.remove('is-out'); c.tabIndex = i ? -1 : 0; c.setAttribute('aria-hidden',String(Boolean(i))); });
        cards[0].focus({preventScroll:true});
      }
      return;
    }
    const answer = e.target.closest('[data-answer]');
    if (answer) {
      const q = answer.closest('[data-quiz]'), ok = Number(q.dataset.quiz);
      $$('[data-answer]',q).forEach(b => { b.classList.toggle('ok', Number(b.dataset.answer) === ok); b.classList.toggle('no', b === answer && Number(b.dataset.answer) !== ok); });
      $('.quiz-result',q).textContent = Number(answer.dataset.answer) === ok ? 'Верно! Палатку. Три гитары зато были.' : 'Почти! Правильный ответ выделен.';
      return;
    }
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const target = anchor.getAttribute('href').slice(1);
    if (anchor.hasAttribute('data-scroll')) {
      e.preventDefault();
      const section = document.getElementById(anchor.dataset.scroll);
      if (section) section.scrollIntoView({behavior:reduced?'instant':'smooth'});
      if (anchor.closest('.hero-actions') && anchor.dataset.scroll === 'request' && $('#occSelect')) {
        $('#occSelect').value = OCCASIONS[ORDER[activeSlide]].name;
      }
      if (anchor.dataset.plan && $('#planSelect')) $('#planSelect').value = anchor.dataset.plan;
      if (anchor.hasAttribute('data-own') && $('#occSelect')) $('#occSelect').value = 'Свой повод';
      closeMenu(); return;
    }
    if (ORDER.includes(target) || target === 'home') {
      e.preventDefault();
      const photo = $('img', anchor);
      pendingFlight = photo && !reduced ? {src:photo.currentSrc || photo.src,rect:photo.getBoundingClientRect()} : null;
      navigate(target);
    }
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'form') return;
    e.preventDefault();
    $('#formNote').textContent = 'Это макет: заявка не отправляется. В рабочей версии она придёт нам в Telegram.';
  });
  $('#slotsToggle').addEventListener('click', e => {
    const on = document.body.classList.toggle('show-slots'); e.currentTarget.setAttribute('aria-pressed',String(on));
  });
  $('#menuToggle').addEventListener('click', () => {
    const menu = $('#mobileMenu'); menu.hidden = !menu.hidden;
    $('#menuToggle').setAttribute('aria-expanded',String(!menu.hidden));
    $('#top').classList.toggle('is-solid',!menu.hidden || scrollY > innerHeight*.3);
  });
  $('#closeFull').addEventListener('click',closeGift);
  $('#giftDialog').addEventListener('cancel', e => { e.preventDefault(); closeGift(); });
  $('#giftDialog').addEventListener('click', e => { if (e.target === $('#giftDialog') && e.clientX < $('#giftDialog').getBoundingClientRect().left) closeGift(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('popstate', () => route(true));
  // Изменение hash пользователем или внешней ссылкой.
  addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    const desired = ORDER.includes(hash) ? hash : 'home';
    if (desired !== currentRoute) route(true);
  });
  addEventListener('visibilitychange', () => { slideAt = performance.now(); syncAllVideos(); });
  addEventListener('resize', () => {
    lastScroll = -1;
    if (orbit) orbit.style.transform = 'translateY(' + $$('.thumb')[activeSlide].offsetTop + 'px)';
  });
  document.addEventListener('toggle', () => { slotsDirty = true; }, true);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { slotsDirty = true; }).observe(main);
  }
  mq.addEventListener('change', e => {
    reduced = e.matches; if (transition) finishSlide(); slideAt = performance.now();
    if (reduced) { if (cloud) cloud.style.transform = ''; sceneLayers.forEach(el => el.style.transform = ''); }
    syncAllVideos(); lastScroll = -1;
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function tick(now) {
    frameNow = now;
    const y = scrollY;
    if (slotsDirty || lastScroll !== y || now < slotsTrackUntil) syncSlotsControl();
    if (lastScroll !== y) {
      $('#top').classList.toggle('is-solid', y > innerHeight * .3 || !$('#mobileMenu').hidden);
      if (!reduced) {
        if (cloud) cloud.style.transform = 'translate3d(' + (Math.sin(now / 12000) * 10) + 'px,' + (-Math.min(y,innerHeight) * .3) + 'px,0) scale(' + (1 + Math.min(y / innerHeight,1) * .3) + ')';
        sceneLayers.forEach(layer => {
          const r = layer.parentNode.getBoundingClientRect();
          if (r.bottom > 0 && r.top < innerHeight) layer.style.transform = 'translate3d(0,' + (r.top * -.075) + 'px,0)';
        });
      }
      lastScroll = y;
    }
    if (hero && !document.hidden && !reduced) {
      const inView = y < hero.offsetHeight;
      if (!inView) slideAt = now;
      if (inView && !transition && now - slideAt >= 5200) setSlide((activeSlide+1)%4,now);
      if (progress) progress.style.transform = 'scaleX(' + Math.min(1,(now-slideAt)/5200) + ')';
      if (cloud && inView) cloud.style.transform = 'translate3d(' + (Math.sin(now / 12000) * 15) + 'px,' + (-Math.min(y,innerHeight) * .3) + 'px,0) scale(' + (1 + Math.min(y / innerHeight,1) * .3) + ')';
      if (transition) {
        const p = Math.min(1,(now-transition.start)/1250);
        const ease = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
        // Маска шириной 135%: мягкая кромка ровно 35% ширины кадра.
        transition.to.style.maskImage = 'linear-gradient(to right,transparent 0%,#000 25.926%,#000 100%)';
        transition.to.style.maskSize = '135% 100%';
        transition.to.style.maskPosition = (100 - ease*135) + 'vw 0';
        $('.visual',transition.to).style.transform = 'scale(' + (1.12 - .08*ease) + ')';
        $('.visual',transition.from).style.transform = 'scale(' + (1.04 + .05*ease) + ')';
        const fog = $('#curtainFog');
        fog.style.left = (95 - ease*135) + '%'; fog.style.opacity = String(Math.sin(p*Math.PI)*.8);
        if (p >= 1) finishSlide();
      }
    }
    requestAnimationFrame(tick);
  }
  route();
  discoverVideo();
  requestAnimationFrame(tick);
})();
