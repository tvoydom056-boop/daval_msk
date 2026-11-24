/* Летопись v2. Один цикл анимации, нативная прокрутка. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const D = window.LETOPIS, P = D.people;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const kids = id => Object.keys(P).filter(key => P[key].parents?.includes(id));
  const escaped = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatted = text => escaped(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const media = (name, slot) => `<video width="1920" height="1080" muted loop playsinline preload="none" poster="assets/v2/scenes/${name}.jpg" data-src="assets/v2/video/${name}.mp4" data-slot="${slot}" aria-hidden="true"></video>`;

  /* Главы собираются из данных. Все подписи остаются в DOM. */
  $('#chapters').innerHTML = D.chapters.map(ch => {
    const p = P[ch.id], title = p.title || p.name;
    return `<article class="chapter" id="chapter-${ch.id}" aria-labelledby="title-${ch.id}">
      <section class="chapter-opening">
        <div class="scene-media" data-parallax=".3">${media(ch.scene, `ВИДЕО ${ch.scene}: ${ch.theme}`)}</div>
        <p class="chapter-theme reveal">${ch.theme}</p>
        <div class="chapter-heading reveal">${ch.self ? '<p class="chapter-self">Рассказывает сам</p>' : ''}<p class="eyebrow">Глава ${ch.number}</p>
        <h2 id="title-${ch.id}">${title.split(' ').map(w => `<span>${w}</span>`).join('')}</h2>
        <p class="chapter-heading__meta">${p.years}<span>·</span>${p.role}</p></div>
      </section>
      <section class="chapter-panel" aria-label="История: ${p.name}">
        <div class="panel-sticky"><div class="panel-window">
          <div class="scene-media">${media(ch.scene, `ВИДЕО ${ch.scene}: сцена внутри бумажной рамки`)}</div>
          <p class="panel-kicker"><span>Глава ${ch.number}</span>${ch.theme}</p>
          <div class="panel-props">${ch.props.map(([id, label, type]) => {
            const photo = type === 'portrait' || ['warphoto', 'brigade', 'teamphoto'].includes(id);
            const src = type === 'portrait' ? `people/${id}.jpg` : `props/${id}.png`;
            const [width, height] = type === 'portrait' ? [600, 750] : D.propSizes[id];
            return `<figure class="prop${photo ? ' prop--photo' : ''}" data-slot="${photo ? 'ФОТО' : 'ПРЕДМЕТ PNG'}: ${escaped(label)}"><div class="prop__reveal"><div class="prop__surface"><img src="assets/v2/${src}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${escaped(label)}"><figcaption>${escaped(label)}</figcaption></div></div></figure>`;
          }).join('')}</div>
          <div class="panel-captions">${ch.captions.map((text, i) => `<div class="panel-caption"><div class="caption-frame"><span class="caption-index">${String(i + 1).padStart(2, '0')} / ${String(ch.captions.length).padStart(2, '0')}</span><p class="caption-text" data-copy="${escaped(text)}">${formatted(text)}</p></div></div>`).join('')}</div>
          <div class="panel-timeline" aria-hidden="true">${ch.captions.map(() => '<span></span>').join('')}</div>
        </div><div class="panel-border"></div></div>
      </section>
      <div class="chapter-quote"><blockquote class="reveal">${escaped(ch.quote)}</blockquote><cite class="reveal">${escaped(ch.credit)}</cite><div class="fog chapter-transition" aria-hidden="true">${media('fog', 'ВИДЕО fog: туман между главами')}</div></div>
    </article>`;
  }).join('');

  /* Бесшовные ленты. Размер набора и число копий зависят от экрана. */
  const family = $('#tree'), stage = $('#treeStage'), lines = $('#treeLines');
  const selection = $('#selection');
  const touchHint = $('#treeTouchHint');
  const dismissTouchHint = () => { touchHint.hidden = true; };
  family.addEventListener('pointerdown', dismissTouchHint, {once: true});
  let rows = [], selected = 'nikolay', locked = false, hovered = null;
  let treeVisible = false, drag = null, suppressClickUntil = 0;
  const normalize = row => { row.offset = ((row.offset % row.span) + row.span) % row.span - row.span; };
  const personHTML = (id, x, copy) => {
    const p = P[id];
    const [given, ...surname] = p.name.split(' ');
    return `<button type="button" class="person${p.live ? ' person--live' : ''}" data-person="${id}" data-copy="${copy}" style="left:${x}px" aria-label="${p.name}, ${p.years}, ${p.role}" aria-pressed="false"><span class="person__photo"><img src="assets/v2/people/${id}.jpg" width="600" height="750" alt="${p.name}" loading="lazy" decoding="async" draggable="false" data-slot="ПОРТРЕТ: ${p.name}"></span><span class="person__name"><span class="person__given">${given}</span> <span class="person__surname">${surname.join(' ')}</span></span><span class="person__years">${p.years}</span><span class="person__role">${p.role}</span></button>`;
  };
  function ribbonLayout(generation, index, screenWidth, mobile) {
    const width = mobile ? 56 : 72;
    const count = generation.ids.length;
    const baseStep = Math.max(mobile ? 132 : 230, 1.04 * screenWidth / count);
    // Balanced deviations keep the loop period at count * baseStep.
    const waves = generation.ids.map((_, i) => Math.sin(2 * Math.PI * i / count + index * .63 + .3));
    const amplitude = Math.max(...waves.map(Math.abs), 1e-9);
    const steps = waves.map(value => Math.max(mobile ? 132 : 0, baseStep * (1 + .08 * value / amplitude)));
    const positions = {};
    let cursor = 0;
    generation.ids.forEach((id, i) => {
      positions[id] = cursor;
      cursor += steps[i];
    });
    return {width, span: cursor, positions, baseStep, steps, photoHeight: mobile ? 70 : 90};
  }
  function renderPositions(row) {
    row.buttons.forEach(button => { button.style.left = `${row.positions[button.dataset.person] + Number(button.dataset.copy) * row.span}px`; });
  }
  function setHovered(id) {
    if (hovered === id) return;
    hovered = id; highlight();
  }
  function buildTree() {
    const mobile = innerWidth <= 700;
    const old = rows.map(r => r.offset / r.span);
    const layouts = D.generations.map((g, index) => ribbonLayout(g, index, innerWidth, mobile));
    $('#ribbons').innerHTML = D.generations.map((g, index) => {
      const {span, positions} = layouts[index];
      const copies = Math.ceil(innerWidth * 2 / span) + 1;
      const contents = Array.from({ length: copies }, (_, copy) => g.ids.map(id => personHTML(id, positions[id] + copy * span, copy)).join('')).join('');
      return `<div class="ribbon" data-generation="${index}"><div class="ribbon__label"><b>${g.label} поколение</b><span>${g.years}</span></div><div class="ribbon__viewport" aria-label="${g.label} поколение, ${g.years}"><div class="ribbon__track" style="width:${span * copies}px">${contents}</div></div></div>`;
    }).join('');
    rows = D.generations.map((g, index) => {
      const el = $(`[data-generation="${index}"]`), viewport = $('.ribbon__viewport', el), track = $('.ribbon__track', el);
      const layout = layouts[index];
      const row = { ...g, ...layout, basePositions: {...layout.positions}, el, viewport, track, offset: 0, velocity: 0, hover: false, pause: 1, tween: null, geometryTween: null, group: null, buttons: $$('.person', track), y: el.offsetTop + viewport.offsetTop };
      const anchor = (layout.positions[g.ids[0]] + layout.positions[g.ids[g.ids.length - 1]]) / 2;
      row.offset = old[index] !== undefined ? old[index] * row.span : innerWidth / 2 + (mobile ? 0 : 60) - layout.width / 2 - anchor;
      normalize(row);
      track.style.transform = `translate3d(${row.offset}px,0,0)`;
      viewport.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') row.hover = true; });
      viewport.addEventListener('pointerleave', () => { row.hover = false; setHovered(null); });
      viewport.addEventListener('pointerover', e => { if (e.pointerType !== 'touch') setHovered(e.target.closest('[data-person]')?.dataset.person || null); });
      viewport.addEventListener('focusin', e => { row.hover = true; setHovered(e.target.closest('[data-person]')?.dataset.person || null); });
      viewport.addEventListener('focusout', () => { row.hover = false; setHovered(null); });
      viewport.addEventListener('dragstart', e => e.preventDefault());
      viewport.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.isPrimary === false) return;
        suppressClickUntil = 0;
        drag = { row, pointer: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastTime: performance.now(), active: false };
        row.velocity = 0;
      });
      viewport.addEventListener('pointermove', e => {
        if (!drag || drag.row !== row || drag.pointer !== e.pointerId) return;
        const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
        if (!drag.active && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { suppressClickUntil = performance.now() + 300; drag = null; return; }
        if (!drag.active && Math.abs(dx) >= 6 && Math.abs(dx) > Math.abs(dy)) {
          release(); drag.active = true; viewport.setPointerCapture(e.pointerId); viewport.classList.add('is-dragging');
        }
        if (drag.active) {
          const now = performance.now(), delta = e.clientX - drag.lastX;
          row.offset += delta;
          row.velocity = clamp(delta / Math.max(8, now - drag.lastTime) * (1000 / 60), -35, 35);
          drag.lastX = e.clientX; drag.lastTime = now;
          suppressClickUntil = now + 300;
          e.preventDefault();
        }
      });
      const endDrag = e => {
        if (!drag || drag.row !== row || drag.pointer !== e.pointerId) return;
        if (drag.active) {
          if (e.type === 'pointercancel' || performance.now() - drag.lastTime > 80) row.velocity = 0;
          suppressClickUntil = performance.now() + 300;
          if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
        }
        viewport.classList.remove('is-dragging'); drag = null;
      };
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      viewport.addEventListener('lostpointercapture', endDrag);
      return row;
    });
    lines.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    $('#line-glow').setAttribute('width', stage.clientWidth + 80);
    $('#line-glow').setAttribute('height', stage.clientHeight + 80);
    if (locked || (mobile && !old.length)) align(selected, true);
    highlight();
    setTabStops();
    addSlots($('#ribbons'));
  }
  function setTabStops() {
    rows.forEach(row => row.ids.forEach(id => {
      const copies = row.buttons.filter(b => b.dataset.person === id);
      let nearest = null, distance = Infinity;
      copies.forEach(b => { const x = row.offset + b.offsetLeft + row.width / 2; const dist = Math.abs(x - innerWidth / 2); if (dist < distance) { nearest = b; distance = dist; } });
      copies.forEach(b => { b.tabIndex = b === nearest ? 0 : -1; });
    }));
  }
  function highlight() {
    const kin = new Set();
    [selected, hovered].filter(Boolean).forEach(id => {
      const p = P[id];
      [id, ...(p.parents || []), ...kids(id), p.spouse].filter(Boolean).forEach(key => kin.add(key));
    });
    family.classList.toggle('is-selected', locked);
    rows.forEach(row => row.buttons.forEach(b => {
      b.classList.toggle('is-current', b.dataset.person === selected);
      b.classList.toggle('is-kin', kin.has(b.dataset.person));
      b.classList.toggle('is-hovered', b.dataset.person === hovered);
      b.setAttribute('aria-pressed', String(locked && b.dataset.person === selected));
    }));
  }
  function align(id, immediate = false) {
    const p = P[id], groups = [p.parents || [], [id], kids(id)].filter(g => g.length);
    const start = performance.now();
    rows.forEach(row => {
      row.group = groups.find(group => group.some(key => row.ids.includes(key))) || null;
      row.tween = null;
      const targetPositions = {...row.basePositions};
      // Keep two selected relatives and their labels inside a phone viewport.
      if (row.group?.length > 1 && innerWidth <= 700) {
        const indexes = row.group.map(key => row.ids.indexOf(key));
        const first = Math.min(...indexes), last = Math.max(...indexes);
        const left = targetPositions[row.ids[first]], right = targetPositions[row.ids[last]];
        if (right - left > innerWidth - 110) {
          const spread = Math.max(132 * (last - first), innerWidth - 110);
          const startX = (left + right - spread) / 2;
          for (let i = first; i <= last; i++) targetPositions[row.ids[i]] = startX + (i - first) * spread / (last - first);
        }
      }
      if (immediate || reduced) { row.positions = targetPositions; renderPositions(row); row.geometryTween = null; }
      else row.geometryTween = {from: {...row.positions}, to: targetPositions, start};
      if (!row.group) return;
      const mean = row.group.reduce((sum, key) => sum + targetPositions[key] + row.width / 2, 0) / row.group.length;
      const k = Math.round((innerWidth / 2 - row.offset - mean) / row.span);
      const to = innerWidth / 2 - mean - k * row.span;
      row.velocity = 0;
      if (immediate || reduced) { row.offset = to; normalize(row); row.track.style.transform = `translate3d(${row.offset}px,0,0)`; }
      else row.tween = { from: row.offset, to, start };
    });
  }
  function select(id) {
    dismissTouchHint();
    family.classList.add('is-aligning');
    selected = id; locked = true; align(id); highlight();
    const p = P[id], hasChapter = D.chapters.some(ch => ch.id === id);
    selection.innerHTML = `<div><h3>${p.name}</h3><p class="selection__years">${p.years} · ${p.role}</p></div><p class="selection__bio">${p.bio}</p><div>${hasChapter ? `<a class="glass-btn" href="#chapter-${id}">Читать историю</a>` : '<p class="selection__empty">Эту историю семья ещё не записала</p>'}<button class="selection__close" type="button">Отпустить древо</button></div>`;
    selection.hidden = false;
    // The shared animation loop also opens the panel on its next frame.
    selection.classList.remove('is-open'); panelOpening = true;
    $('.selection__close', selection).addEventListener('click', release);
    setTabStops();
  }
  let panelOpening = false;
  function release() {
    if (!locked) return;
    locked = false; panelOpening = false; family.classList.remove('is-aligning');
    rows.forEach(row => {
      row.group = null; row.tween = null;
      if (reduced) { row.positions = {...row.basePositions}; renderPositions(row); row.geometryTween = null; }
      else row.geometryTween = {from: {...row.positions}, to: {...row.basePositions}, start: performance.now()};
    });
    selection.classList.remove('is-open'); selection.hidden = true; highlight();
  }
  stage.addEventListener('click', e => {
    if (performance.now() < suppressClickUntil) return;
    const person = e.target.closest('[data-person]');
    if (person) select(person.dataset.person); else release();
  });
  family.addEventListener('click', e => { if (!e.target.closest('.person,.selection')) release(); });

  /* Геометрия связей берётся у ближайших копий, без чтения каждого портрета. */
  function point(id, nearX = innerWidth / 2) {
    const row = rows.find(r => r.ids.includes(id));
    const local = row.positions[id] + row.width / 2;
    const k = Math.round((nearX - row.offset - local) / row.span);
    return { x: row.offset + local + k * row.span, top: row.y, bottom: row.y + row.photoHeight };
  }
  const avg = points => points.reduce((sum, p) => sum + p.x, 0) / points.length;
  function connectionPaths(id, straight) {
    const p = P[id], self = point(id), out = [];
    const parents = (p.parents || []).map(key => point(key, self.x));
    const children = kids(id).map(key => point(key, self.x));
    const connect = (from, to) => {
      const x1 = avg(from), x2 = avg(to), y1 = from[0].bottom, y2 = to[0].top;
      if (straight) {
        const a = y1 + 16, b = y2 - 16;
        from.forEach(q => out.push(`M${q.x},${q.bottom}V${a}H${x1}`));
        out.push(`M${x1},${a}L${x2},${b}`);
        to.forEach(q => out.push(`M${x2},${b}H${q.x}V${q.top}`));
      } else {
        from.forEach(a => to.forEach(b => { const mid = (y1 + y2) / 2; out.push(`M${a.x},${y1}C${a.x},${mid} ${b.x},${mid} ${b.x},${y2}`); }));
      }
    };
    if (parents.length) connect(parents, [self]);
    if (children.length) connect([self], children);
    if (p.spouse) {
      const partner = point(p.spouse, self.x), y = self.top + (self.bottom - self.top) * .55;
      const half = rows.find(r => r.ids.includes(id)).width / 2 + 5;
      const side = partner.x > self.x ? 1 : -1;
      out.push(`M${self.x + half * side},${y}H${partner.x - half * side}`);
    }
    return out;
  }
  const parentEdges = Object.entries(P).flatMap(([child, person]) => (person.parents || []).map(parent => ({parent, child})));
  function visiblePoints(id) {
    const row = rows.find(r => r.ids.includes(id));
    const local = row.positions[id] + row.width / 2;
    const first = Math.ceil((-80 - row.offset - local) / row.span);
    const last = Math.floor((innerWidth + 80 - row.offset - local) / row.span);
    return Array.from({length: Math.max(0, last - first + 1)}, (_, i) => ({x: row.offset + local + (first + i) * row.span, top: row.y, bottom: row.y + row.photoHeight}));
  }
  function drawConnections(now) {
    const settled = locked && !rows.some(r => r.tween);
    const seen = new Set();
    let markup = '';
    parentEdges.forEach(({parent, child}, i) => {
      const pairs = [
        ...visiblePoints(child).map(b => [point(parent, b.x), b]),
        ...visiblePoints(parent).map(a => [a, point(child, a.x)])
      ];
      pairs.forEach(([a, b]) => {
        const key = `${parent}:${child}:${Math.round(a.x)}:${Math.round(b.x)}`;
        if (seen.has(key)) return;
        seen.add(key);
        const mid = (a.bottom + b.top) / 2;
        const sway = reduced ? 0 : Math.sin(now * .00065 + i * 1.3) * 5;
        markup += `<path class="kin-line" d="M${a.x},${a.bottom}C${a.x + sway},${mid} ${b.x - sway},${mid} ${b.x},${b.top}"/>`;
      });
    });
    markup += connectionPaths(selected, settled).map(d => `<path class="active-line" d="${d}"/>`).join('');
    if (hovered && hovered !== selected) markup += connectionPaths(hovered, false).map(d => `<path class="active-line hover-line" d="${d}"/>`).join('');
    lines.innerHTML = markup;
  }

  /* Однократное появление и учёт видимых блоков. */
  const visible = new Set();
  const visibility = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
    if (e.target === family) { treeVisible = e.isIntersecting; if (treeVisible) setTabStops(); }
  }), { rootMargin: '100px 0px' });
  const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting || reduced) { e.target.classList.add('is-in'); revealObserver.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => { if (reduced) el.classList.add('is-in'); else revealObserver.observe(el); });
  visibility.observe(family);
  const parallax = $$('[data-parallax]').map(el => ({ el, block: el.parentElement, speed: Number(el.dataset.parallax) }));
  parallax.forEach(item => visibility.observe(item.block));
  const panels = $$('.chapter-panel').map(el => ({ el, sticky: $('.panel-sticky', el), props: $$('.prop', el), captions: $$('.panel-caption', el), timeline: $$('.panel-timeline span', el), index: -1 }));
  panels.forEach(p => visibility.observe(p.el));

  /* Строки подписей измеряются в настоящем шрифте и поднимаются по одной. */
  function wrapCaptions() {
    const texts = $$('.caption-text');
    texts.forEach(el => {
      let emphasis = false;
      el.innerHTML = el.dataset.copy.split(/(\*)/).map(part => {
        if (part === '*') { emphasis = !emphasis; return ''; }
        return part.split(/(\s+)/).map(word => !word.trim() ? word : `<span class="caption-word">${emphasis ? `<em>${escaped(word)}</em>` : escaped(word)}</span>`).join('');
      }).join('');
    });
    texts.forEach(el => {
      const groups = [];
      $$('.caption-word', el).forEach(word => {
        const y = word.offsetTop;
        if (!groups.length || groups[groups.length - 1].y !== y) groups.push({ y, words: [] });
        groups[groups.length - 1].words.push(word.innerHTML);
      });
      el.innerHTML = groups.map((g, i) => `<span class="caption-line" style="--line:${i}"><span>${g.words.join(' ')}</span></span>`).join('');
      el.style.setProperty('--accent-delay', `${2 + Math.max(0, groups.length - 1) * .2}s`);
    });
  }

  /* Готовые MP4 перечислены в data.js. Источник загружается при входе в кадр;
     за пределами экрана, в скрытой вкладке и при reduced motion видео на паузе. */
  const videos = $$('video'), inViewVideos = new Set();
  const availableVideos = new Set([...(D.videos || []).map(name => `${name}.mp4`), ...(window.LETOPIS_VIDEO_FILES || [])]);
  const failedVideos = new WeakSet();
  function playIfVisible(video) {
    if (reduced || document.hidden || !inViewVideos.has(video) || failedVideos.has(video)) { video.pause(); return; }
    const file = video.dataset.src.split('/').pop();
    if (!availableVideos.has(file) && !availableVideos.has(video.dataset.src)) return;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    const promise = video.play();
    if (promise) promise.catch(() => {});
  }
  const videoObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { inViewVideos.add(e.target); playIfVisible(e.target); }
    else { inViewVideos.delete(e.target); e.target.pause(); }
  }), { threshold: .01 });
  videos.forEach(video => {
    video.muted = true;
    video.addEventListener('error', e => { e.preventDefault(); failedVideos.add(video); video.pause(); video.removeAttribute('src'); video.load(); });
    videoObserver.observe(video);
  });
  document.addEventListener('visibilitychange', () => {
    videos.forEach(playIfVisible);
  });

  /* Навигация и исходные инструменты v1. */
  const menuToggle = $('#menuToggle'), menu = $('#mobileMenu');
  function closeMenu() { menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }
  menuToggle.addEventListener('click', () => { menu.hidden = !menu.hidden; menuToggle.setAttribute('aria-expanded', String(!menu.hidden)); });
  $$('#top a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!e.target.closest('#top')) closeMenu(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { release(); closeMenu(); } });
  const compare = $('#compare'), range = $('input', compare);
  range.addEventListener('input', () => compare.style.setProperty('--pos', `${range.value}%`));
  $$('[data-plan]').forEach(a => a.addEventListener('click', () => { $('#planSelect').value = a.dataset.plan; }));
  $('#form').addEventListener('submit', e => { e.preventDefault(); $('#formNote').textContent = 'Это макет: заявка не отправляется. В рабочей версии она придёт нам в Telegram.'; });
  function addSlots(root = document) {
    $$('[data-slot]', root).forEach(el => {
      const host = el.matches('img,video') ? el.parentElement : el;
      if ($(':scope > .slot-label', host)) return;
      const label = document.createElement('span'); label.className = 'slot-label'; label.textContent = el.dataset.slot; label.setAttribute('aria-hidden', 'true'); host.appendChild(label);
    });
  }
  const slotsToggle = $('#slotsToggle');
  slotsToggle.textContent = 'Слоты';
  slotsToggle.setAttribute('aria-label', 'Показать слоты медиа');
  slotsToggle.setAttribute('aria-pressed', 'false');
  slotsToggle.addEventListener('click', e => { const on = document.body.classList.toggle('show-slots'); e.currentTarget.setAttribute('aria-pressed', String(on)); });
  addSlots();

  function slotDock(screenWidth, screenHeight, obstacles) {
    const mobile = screenWidth <= 700, width = mobile ? 48 : 64, height = 30, right = mobile ? 6 : 18, guard = mobile ? 3 : 6;
    const defaultTop = screenHeight - (mobile ? 72 : 14) - height;
    const left = screenWidth - right - width;
    // Move upward only when a visible label or action occupies the default dock.
    const candidates = [defaultTop, ...obstacles.map(r => r.top - height - guard)].filter(top => top >= (mobile ? 78 : 90) && top <= defaultTop).sort((a,b) => b-a);
    for (const top of candidates) {
      const collision = obstacles.some(r => left < r.right + guard && left + width > r.left - guard && top < r.bottom + guard && top + height > r.top - guard);
      if (!collision) return {top, left, width, height, hidden:false};
    }
    return {top: defaultTop, left, width, height, hidden:true};
  }
  function positionSlots() {
    const selector = treeVisible ? '#selection .glass-btn,#selection .selection__close,.family__bottom,#treeTouchHint' : '.btn,.glass-btn,.form input,.form select,.form textarea,.player__time,.chapter-heading,.chapter-quote cite,.foot__in>span';
    const obstacles = $$(selector).map(el => el.getBoundingClientRect()).filter(r => r.width && r.height && r.bottom > 0 && r.top < innerHeight);
    if (treeVisible) {
      rows.forEach(row => row.buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.right <= -80 || rect.left >= innerWidth + 80 || rect.bottom <= 0 || rect.top >= innerHeight) return;
        obstacles.push(rect);
        $$('.person__given,.person__surname', button).forEach(label => obstacles.push(label.getBoundingClientRect()));
        if (button.classList.contains('is-current') || button.classList.contains('is-hovered')) {
          const role = $('.person__role', button);
          if (getComputedStyle(role).opacity !== '0') obstacles.push(role.getBoundingClientRect());
        }
      }));
      const panel = selection.getBoundingClientRect();
      if (panel.width && panel.height) obstacles.push(panel);
    }
    const dock = slotDock(innerWidth, innerHeight, obstacles);
    slotsToggle.style.bottom = `${innerHeight - dock.top - dock.height}px`;
    slotsToggle.style.visibility = dock.hidden ? 'hidden' : '';
  }

  /* Демонстрационная шкала голоса, как в v1. Звук не подменяется. */
  const wave = $('#wave'), ctx = wave.getContext('2d');
  const bars = Array.from({ length: 72 }, (_, i) => .15 + .75 * Math.abs(Math.sin(i * .55) * Math.cos(i * .17 + 1)));
  let playing = false, audioTime = 0;
  const formatTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function drawWave() {
    const w = wave.clientWidth, h = 64, dpr = devicePixelRatio || 1;
    if (wave.width !== w * dpr || wave.height !== h * dpr) { wave.width = w * dpr; wave.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    bars.forEach((b, i) => { ctx.fillStyle = i / bars.length < audioTime / 42 ? '#c9894a' : '#c8bbab'; const bh = Math.max(3, b * h); ctx.fillRect(i * w / bars.length + 1, (h - bh) / 2, Math.max(1.5, w / bars.length - 3), bh); });
    $('#playTime').textContent = `${formatTime(audioTime)} / 0:42`;
  }
  $('#playBtn').addEventListener('click', () => { playing = !playing; $('#playBtn').textContent = playing ? 'Пауза' : 'Слушать'; });
  visibility.observe($('.player'));

  let scrollDirty = true, resizeTimer;
  addEventListener('scroll', () => { scrollDirty = true; }, { passive: true });
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildTree(); wrapCaptions(); drawWave(); scrollDirty = true; }, 150);
  });
  motion.addEventListener('change', e => {
    reduced = e.matches;
    rows.forEach(row => { row.velocity = 0; });
    if (reduced) {
      if (locked) align(selected, true);
      else rows.forEach(row => { row.tween = null; row.geometryTween = null; row.positions = {...row.basePositions}; renderPositions(row); });
    }
    videos.forEach(playIfVisible);
    $$('.reveal').forEach(el => { if (reduced) el.classList.add('is-in'); });
    parallax.forEach(item => { if (reduced) item.el.style.transform = 'none'; });
    panels.forEach(p => { if (reduced) p.props.forEach(el => el.classList.add('is-in')); });
    wrapCaptions();
  });
  buildTree(); drawWave();
  document.fonts.ready.then(wrapCaptions);

  /* Единый rAF: ленты, инерция, связи, параллакс, панели, покачивание. */
  let last = 0, lastInk = 0, frame = 0, lastSlotPosition = 0;
  function tick(now) {
    const dt = last ? Math.min(64, now - last) : 1000 / 60;
    const frames = dt / (1000 / 60); last = now;
    const checkSlotPosition = treeVisible || scrollDirty || panelOpening || now - lastSlotPosition > 250;
    if (!document.hidden) {
      if (!document.body.classList.contains('is-ready')) document.body.classList.add('is-ready');
      if (panelOpening) { selection.classList.add('is-open'); panelOpening = false; }
      if (treeVisible) {
        rows.forEach(row => {
          if (row.geometryTween) {
            const t = clamp((now - row.geometryTween.start) / 900), p = ease(t);
            row.ids.forEach(id => { row.positions[id] = row.geometryTween.from[id] + (row.geometryTween.to[id] - row.geometryTween.from[id]) * p; });
            renderPositions(row);
            if (t >= 1) row.geometryTween = null;
          }
          if (row.tween) {
            const t = clamp((now - row.tween.start) / 900);
            row.offset = row.tween.from + (row.tween.to - row.tween.from) * ease(t);
            if (t >= 1) { row.tween = null; normalize(row); setTabStops(); }
          } else if (!(locked && row.group) && !(innerWidth <= 700 && !touchHint.hidden && row.group) && !reduced && !(drag?.active && drag.row === row)) {
            row.pause = clamp(row.pause + (row.hover ? -1 : 1) * dt / 400);
            row.offset += row.speed * frames * row.pause + row.velocity * frames;
            row.velocity *= Math.pow(.95, frames);
            if (Math.abs(row.velocity) < .01) row.velocity = 0;
            normalize(row);
          }
          normalize(row);
          row.track.style.transform = `translate3d(${row.offset}px,0,0)`;
        });
        drawConnections(now);
        if (locked && !rows.some(row => row.tween || row.geometryTween)) family.classList.remove('is-aligning');
        if (++frame % 120 === 0) setTabStops();
      }
      parallax.forEach(item => {
        if (!visible.has(item.block) || reduced) return;
        const rect = item.block.getBoundingClientRect();
        const y = (innerHeight / 2 - rect.top - rect.height / 2) * item.speed;
        item.el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
      });
      let inkVisible = false;
      panels.forEach(panel => {
        if (!visible.has(panel.el)) return;
        const rect = panel.el.getBoundingClientRect();
        const p = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
        panel.sticky.style.setProperty('--close', reduced ? '1' : clamp(p / .32).toFixed(4));
        const index = Math.min(panel.captions.length - 1, Math.floor(clamp((p - .03) / .94) * panel.captions.length));
        if (rect.top < innerHeight * .25 && index !== panel.index) {
          panel.index = index;
          panel.captions.forEach((el, i) => el.classList.toggle('is-current', i === index));
          panel.timeline.forEach((el, i) => el.classList.toggle('is-read', i <= index));
        }
        panel.props.forEach((prop, i) => {
          if (reduced || p >= i * .12 + .015) prop.classList.add('is-in');
          if (!reduced && prop.classList.contains('is-in')) prop.style.setProperty('--bob', `${(Math.sin(now * .001 + i * 1.7) * 4).toFixed(2)}px`);
        });
        inkVisible = true;
      });
      if (inkVisible && !reduced && now - lastInk > 125) { $('#inkNoise').setAttribute('seed', String(Math.floor(now / 125) % 11)); lastInk = now; }
      if (playing && visible.has($('.player'))) {
        audioTime = Math.min(42, audioTime + dt / 1000); drawWave();
        if (audioTime >= 42) { playing = false; audioTime = 0; $('#playBtn').textContent = 'Слушать'; }
      }
      if (scrollDirty) {
        const inServices = $('.archive-services').getBoundingClientRect().top < 70;
        const onPaper = panels.some(p => { const r = p.el.getBoundingClientRect(); return r.top < 70 && r.bottom > 70; }) || $$('.chapter-quote').some(el => { const r = el.getBoundingClientRect(); return r.top < 70 && r.bottom > 70; });
        $('#top').classList.toggle('is-paper', inServices || onPaper); scrollDirty = false;
      }
      if (checkSlotPosition) { positionSlots(); lastSlotPosition = now; }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
