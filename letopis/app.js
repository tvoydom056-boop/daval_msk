/* Летопись - интерактив макета */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* шапка становится светлой после первого экрана */
  const top = $('#top'), hero = $('.hero');
  const onScroll = () => top.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - 80);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* главы */
  $$('.chapters button').forEach(b => b.addEventListener('click', () => {
    $$('.chapters button').forEach(x => x.classList.toggle('is-on', x === b));
    $$('.chapter').forEach(c => c.classList.toggle('is-on', c.dataset.ch === b.dataset.ch));
  }));

  /* свеча */
  const candle = $('.candle'), cnt = $('#candleCount'), cBtn = $('#candleBtn');
  cBtn.addEventListener('click', () => {
    if (candle.classList.contains('is-lit')) return;
    candle.classList.add('is-lit');
    cnt.textContent = (+cnt.textContent + 1).toString();
    cBtn.textContent = 'Свеча зажжена';
    cBtn.disabled = true;
  });

  /* до / после */
  const cmp = $('#compare'), rng = cmp.querySelector('input');
  const setPos = v => cmp.style.setProperty('--pos', v + '%');
  rng.addEventListener('input', () => setPos(rng.value));
  setPos(rng.value);

  /* слоты медиа */
  $('#slotsToggle').addEventListener('click', () => document.body.classList.toggle('show-slots'));

  /* выбор пакета -> форма */
  $$('[data-plan]').forEach(a => a.addEventListener('click', () => { $('#planSelect').value = a.dataset.plan; }));
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    $('#formNote').textContent = 'Это макет: заявка не отправляется. В рабочей версии она придёт нам в Telegram.';
  });

  /* QR */
  try {
    const qr = qrcode(0, 'M'); qr.addData('https://letopis.ru/p/sokolov-nikolay'); qr.make();
    const c = $('#qrCanvas'), ctx = c.getContext('2d'), n = qr.getModuleCount(), s = c.width / n;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#1D1A16';
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) ctx.fillRect(Math.floor(q * s), Math.floor(r * s), Math.ceil(s), Math.ceil(s));
  } catch (e) { /* без сети библиотека QR не загрузится */ }

  /* голосовое: имитация проигрывания (файл подключается позже) */
  const wave = $('#wave'), wctx = wave.getContext('2d');
  const bars = Array.from({ length: 72 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17 + 1)) * (0.6 + 0.4 * Math.random()));
  const DUR = 42; let t = 0, playing = false, last = 0;
  const draw = () => {
    const w = wave.clientWidth, h = 64, dpr = devicePixelRatio || 1;
    if (wave.width !== w * dpr) { wave.width = w * dpr; wave.height = h * dpr; }
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.clearRect(0, 0, w, h);
    const bw = w / bars.length, p = t / DUR;
    bars.forEach((b, i) => {
      wctx.fillStyle = i / bars.length < p ? '#9C7644' : '#D9CFBE';
      const bh = Math.max(3, b * h);
      wctx.fillRect(i * bw + 1, (h - bh) / 2, Math.max(1.5, bw - 3), bh);
    });
  };
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const tick = now => {
    if (!playing) return;
    t = Math.min(DUR, t + (now - last) / 1000); last = now;
    $('#playTime').textContent = `${fmt(t)} / ${fmt(DUR)}`; draw();
    if (t >= DUR) { playing = false; t = 0; $('#playBtn').textContent = 'Слушать'; return; }
    requestAnimationFrame(tick);
  };
  $('#playBtn').addEventListener('click', () => {
    playing = !playing; $('#playBtn').textContent = playing ? 'Пауза' : 'Слушать';
    if (playing) { last = performance.now(); requestAnimationFrame(tick); }
  });
  addEventListener('resize', draw); draw();

  /* древо */
  const P = {
    petr:     { n: 'Пётр Алексеевич Соколов', y: '1902 - 1943', rel: 'Отец', g: 0, x: 1, sp: 'maria', page: true,
                bio: 'Плотник из села Тереньга. Ушёл на фронт в 1941 году и погиб под Курском. От него остались одно фото, два письма и рубанок.' },
    maria:    { n: 'Мария Фёдоровна Соколова', y: '1906 - 1988', rel: 'Мать', g: 0, x: 2, page: true,
                bio: 'Одна подняла троих детей. Работала дояркой, потом учётчицей. По воскресеньям пекла пироги с калиной, рецепт перешёл к невестке.' },
    nikolay:  { n: 'Николай Петрович Соколов', y: '1931 - 2019', rel: 'Герой страницы', g: 1, x: 1, sp: 'anna', par: ['petr', 'maria'], page: true, ph: 'assets/img/nikolay-color.jpg',
                bio: 'Инженер-мостостроитель. 34 года в мостостроительном отряде, мосты через Свиягу, Суру и Каму. Строгал внукам деревянные кораблики.' },
    anna:     { n: 'Анна Ивановна Соколова', y: '1933 - 2021', rel: 'Жена', g: 1, x: 2, page: true, ph: 'assets/img/anna-bw.jpg',
                bio: 'Учительница начальных классов, 38 лет в одной школе. Познакомилась с Николаем на танцах в 1952 году. Хранила все письма семьи.' },
    sergey:   { n: 'Сергей Николаевич Соколов', y: 'род. 1958', rel: 'Сын', g: 2, x: 0, sp: 'irina', par: ['nikolay', 'anna'], live: true,
                bio: 'Водитель-дальнобойщик, теперь на пенсии. Помнит все мосты, которые строил отец, и показывает их внукам.' },
    irina:    { n: 'Ирина Викторовна Соколова', y: 'род. 1960', rel: 'Невестка', g: 2, x: 1, live: true,
                bio: 'Медсестра. Продолжает печь пироги с калиной по рецепту Марии Фёдоровны.' },
    olga:     { n: 'Ольга Николаевна Белова', y: 'род. 1961', rel: 'Дочь', g: 2, x: 2.5, par: ['nikolay', 'anna'], live: true,
                bio: 'Бухгалтер. Хранит медали и грамоты отца и семейный альбом.' },
    dmitry:   { n: 'Дмитрий Сергеевич Соколов', y: 'род. 1984', rel: 'Внук', g: 3, x: 0.5, par: ['sergey', 'irina'], live: true,
                bio: 'Инженер-проектировщик, пошёл по стопам деда.' },
    ekaterina:{ n: 'Екатерина Андреевна Белова', y: 'род. 1988', rel: 'Внучка', g: 3, x: 2.5, par: ['olga'], live: true,
                bio: 'Записала рассказы деда на диктофон в 2016 году и собрала эту страницу.' },
    misha:    { n: 'Михаил Дмитриевич Соколов', y: 'род. 2015', rel: 'Правнук', g: 4, x: 0.5, par: ['dmitry'], live: true,
                bio: 'Хранит на полке рубанок прапрадеда Петра.' }
  };
  Object.entries(P).forEach(([id, p]) => { p.id = id; });
  // супруги взаимно
  Object.values(P).forEach(p => { if (p.sp) P[p.sp].sp = p.id; });
  const kids = id => Object.values(P).filter(p => p.par && p.par.includes(id)).map(p => p.id);
  const initials = n => n.split(' ').slice(0, 2).map(w => w[0]).join('');

  const canvas = $('#treeCanvas'), svg = $('#treeLines');
  const inner = document.createElement('div'); inner.className = 'tree__inner';
  canvas.appendChild(inner); inner.appendChild(svg);
  const els = {};
  Object.values(P).forEach(p => {
    const b = document.createElement('button');
    b.className = 'person' + (p.live ? ' person--live' : '');
    b.dataset.id = p.id;
    b.innerHTML = `<span class="person__ph" style="${p.ph ? `background-image:url('${p.ph}')` : ''}">${p.ph ? '' : initials(p.n)}</span>
      <span class="person__n"><span class="person__dot"></span>${p.n.split(' ').slice(0, 2).join(' ')}<span class="person__y">${p.y}</span></span>`;
    b.addEventListener('click', () => select(p.id));
    inner.appendChild(b); els[p.id] = b;
  });

  let geo = {};
  const layout = () => {
    const mobile = innerWidth < 820;
    const maxX = Math.max(...Object.values(P).map(p => p.x));
    const RH = mobile ? 74 : 76, GAP = mobile ? 44 : 52;
    const W = mobile ? 184 : Math.max(176, Math.min(214, (canvas.clientWidth + 14) / (maxX + 1))), CW = W - 14;
    const total = (maxX + 1) * W - (W - CW);
    const avail = canvas.clientWidth;
    const off = Math.max(0, (avail - total) / 2);
    inner.style.width = Math.max(avail, total) + 'px';
    inner.style.height = (5 * RH + 4 * GAP) + 'px';
    geo = {};
    Object.values(P).forEach(p => {
      const l = off + p.x * W, t = p.g * (RH + GAP);
      Object.assign(els[p.id].style, { left: l + 'px', top: t + 'px', width: CW + 'px', height: RH + 'px' });
      geo[p.id] = { l, t, r: l + CW, b: t + RH, cx: l + CW / 2, cy: t + RH / 2 };
    });
    svg.setAttribute('width', inner.style.width); svg.setAttribute('height', inner.style.height);
    let d = '';
    const paths = [];
    // пары
    Object.values(P).forEach(p => {
      if (p.sp && p.x < P[p.sp].x) {
        const a = geo[p.id], b = geo[p.sp];
        paths.push({ d: `M${a.r} ${a.cy}H${b.l}`, ids: [p.id, p.sp] });
      }
    });
    // дети
    Object.values(P).forEach(c => {
      if (!c.par) return;
      const cg = geo[c.id];
      let sx, sy;
      if (c.par.length === 2) { const a = geo[c.par[0]], b = geo[c.par[1]]; sx = (Math.min(a.r, b.r) + Math.max(a.l, b.l)) / 2; sy = a.cy; }
      else { const a = geo[c.par[0]]; sx = a.cx; sy = a.b; }
      const my = cg.t - GAP / 2;
      paths.push({ d: `M${sx} ${sy}V${my}H${cg.cx}V${cg.t}`, ids: [...c.par, c.id] });
    });
    if (mobile && !layout.done) { canvas.scrollLeft = Math.max(0, geo.nikolay.cx - canvas.clientWidth / 2); layout.done = true; }
    svg.innerHTML = paths.map(p => `<path d="${p.d}" data-ids="${p.ids.join(' ')}"/>`).join('');
    highlight();
  };

  let cur = 'nikolay';
  const highlight = () => {
    $$('path', svg).forEach(p => p.classList.toggle('is-hot', p.dataset.ids.split(' ').includes(cur)));
  };
  const relOf = id => {
    const p = P[id], out = [];
    if (p.par) p.par.forEach(x => out.push(x));
    if (p.sp) out.push(p.sp);
    kids(id).forEach(x => out.push(x));
    return [...new Set(out)];
  };
  const card = $('#treeCard');
  const select = (id, scroll) => {
    cur = id; const p = P[id];
    Object.values(els).forEach(e => e.classList.remove('is-on', 'is-rel'));
    els[id].classList.add('is-on');
    const rel = relOf(id); rel.forEach(r => els[r].classList.add('is-rel'));
    card.innerHTML = `
      <div class="tc__ph" style="${p.ph ? `background-image:url('${p.ph}')` : ''}">${p.ph ? '' : initials(p.n)}</div>
      <p class="tc__rel">${p.rel}</p>
      <p class="tc__name">${p.n}</p>
      <p class="tc__years">${p.y}</p>
      <p class="tc__bio">${p.bio}</p>
      <p class="tc__kin">Родные</p>
      <div class="tc__chips">${rel.map(r => `<button data-id="${r}">${P[r].n.split(' ').slice(0, 2).join(' ')}</button>`).join('')}</div>
      ${p.id === 'nikolay' ? `<a class="btn tc__open" href="#example">Открыть страницу памяти</a>` : p.page ? `<p class="tc__live">Для этого человека можно собрать свою страницу памяти и связать её с древом.</p>` : `<p class="tc__live">Участник семьи. Расскажет о себе сам, если захочет.</p>`}`;
    $$('.tc__chips button', card).forEach(b => b.addEventListener('click', () => select(b.dataset.id)));
    highlight();
    if (scroll) document.getElementById('tree').scrollIntoView({ behavior: 'smooth' });
  };
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => select(b.dataset.goto, true)));
  $$('.pill').forEach(b => b.addEventListener('click', () => {
    $$('.pill').forEach(x => x.classList.toggle('is-on', x === b));
    $('.tree').classList.toggle('is-family', b.dataset.priv === 'family');
  }));
  addEventListener('resize', layout);
  layout(); select('nikolay');
})();
