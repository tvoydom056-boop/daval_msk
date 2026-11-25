import {family as D,people as P} from '../data.js';
import {gsap,pinTimeline,addFrame,clamp} from '../lib/core.js';
import {letters} from '../lib/text.js';

export function mountTree() {
  document.getElementById('petr').insertAdjacentHTML('beforebegin',`<section class="film-scene family-tree-scene" id="tree" data-scene="tree" data-pin-vh="220" aria-labelledby="tree-title"><div class="scene-stage tree-screen"><header class="tree-heading"><h2 id="tree-title">Из корней вырастаем мы.</h2></header><div class="tree-window"><div class="tree-stage" id="treeStage"><svg id="treeLines" aria-hidden="true"></svg><div id="ribbons"></div></div></div><aside class="selection" id="selection" hidden aria-live="polite"></aside><p class="tree-instruction" id="treeTouchHint">Потяните ленту или выберите человека</p><p class="tree-footnote">Вымышленная семья для демонстрации макета.</p></div></section>`);
  letters(document.getElementById('tree-title'),'tree-title-char');
}
export function initTree({goTo}) {
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const kids=id=>Object.keys(P).filter(key=>(P[key].parents||[]).includes(id));
  const ease=t=>1-Math.pow(1-t,3);
  let reduced=false,frame=0;
  const growth={draw:0,move:0};
  const camera={zoom:2.4,focus:0,overview:0};
  const cameraFrame={scale:1,x:0};
  /* Бесшовные ленты. Размер набора и число копий зависят от экрана. */
  const family = $('#tree'), stage = $('#treeStage'), lines = $('#treeLines');
  const selection = $('#selection');
  const touchHint = $('#treeTouchHint');
  const dismissTouchHint = () => { family.classList.add('has-tree-interaction'); };
  family.addEventListener('pointerdown', dismissTouchHint, {once: true});
  let rows = [], selected = 'nikolay', locked = false, hovered = null;
  let treeVisible = false, drag = null, suppressClickUntil = 0;
  const normalize = row => { row.offset = ((row.offset % row.span) + row.span) % row.span - row.span; };
  const personHTML = (id, x, copy) => {
    const p = P[id];
    const [given, ...surname] = p.name.split(' ');
    return `<button type="button" class="person${p.live ? ' person--live' : ''}" data-person="${id}" data-copy="${copy}" style="transform:translate3d(${x}px,0,0)" aria-label="${p.name}, ${p.years}, ${p.role}" aria-pressed="false"><span class="person__photo"><img src="./media/people/${id}.jpg" width="600" height="750" alt="${p.name}" loading="lazy" decoding="async" draggable="false" data-slot="ПОРТРЕТ: ${p.name}"></span><span class="person__name"><span class="person__given">${given}</span> <span class="person__surname">${surname.join(' ')}</span></span><span class="person__years">${p.years}</span><span class="person__role">${p.role}</span></button>`;
  };
  function ribbonLayout(generation, index, screenWidth, mobile) {
    const width = mobile ? 72 : 112;
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
    return {width, span: cursor, positions, baseStep, steps, photoHeight: width * 1.25};
  }
  function renderPositions(row) {
    row.buttons.forEach(button => { button.style.transform = `translate3d(${row.positions[button.dataset.person] + Number(button.dataset.copy) * row.span}px,0,0)`; });
  }
  function setHovered(id) {
    if (hovered === id) return;
    hovered = id; highlight();
  }
  function buildTree() {
    const mobile = innerWidth <= 700;
    const old = rows.map(r => r.offset / r.span);
    const layouts = D.generations.map((g, index) => ribbonLayout(g, index, innerWidth, mobile));
    // The opening shot keeps the two founders together on a phone as well.
    if(mobile)layouts[0].positions.maria=76;
    $('#ribbons').innerHTML = D.generations.map((g, index) => {
      const {span, positions} = layouts[index];
      const copies = Math.ceil(innerWidth * 2 / span) + 1;
      const contents = Array.from({ length: copies }, (_, copy) => g.ids.map(id => personHTML(id, positions[id] + copy * span, copy)).join('')).join('');
      return `<div class="ribbon" data-generation="${index}"><div class="ribbon__label" aria-label="${g.label} поколение, ${g.years}"><b>${g.label}</b><span>${g.years}</span></div><div class="ribbon__viewport" aria-label="${g.label} поколение, ${g.years}"><div class="ribbon__track" style="width:${span * copies}px">${contents}</div></div></div>`;
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
          const now = performance.now(), delta = (e.clientX - drag.lastX)/cameraFrame.scale;
          row.offset += delta;
          if (reduced) { normalize(row); row.track.style.transform = `translate3d(${row.offset}px,0,0)`; drawConnections(performance.now()); }
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


    if (locked) align(selected, true);
    else if(!old.length){
      const row=rows[0];
      row.offset=innerWidth/2-(row.positions.petr+row.positions.maria)/2-row.width/2;
      normalize(row);row.track.style.transform=`translate3d(${row.offset}px,0,0)`;
    }
    highlight();
    setTabStops();
    syncSizes();
  }
  function setTabStops() {
    rows.forEach(row => row.ids.forEach(id => {
      const copies = row.buttons.filter(b => b.dataset.person === id);
      let nearest = null, distance = Infinity;
      copies.forEach(b => { const x = row.offset + row.positions[id] + Number(b.dataset.copy) * row.span + row.width / 2; const dist = Math.abs(x - innerWidth / 2); if (dist < distance) { nearest = b; distance = dist; } });
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
    selected = id; locked = true; highlight();
    const p = P[id], hasChapter = D.chapters.some(ch => ch.id === id);
    selection.innerHTML = `<div><h3>${p.name}</h3><p class="selection__years">${p.years} · ${p.role}</p></div><p class="selection__bio">${p.bio}</p><div>${hasChapter ? `<a class="glass-btn" href="#${id}">Читать историю</a>` : '<p class="selection__empty">Эту историю семья ещё не записала</p>'}<button class="selection__close" type="button">Отпустить древо</button></div>`;
    selection.hidden = false;
    // The shared animation loop also opens the panel on its next frame.
    selection.classList.remove('is-open'); panelOpening = true;
    $('.selection__close', selection).addEventListener('click', release);
    syncSizes(); align(id); setTabStops(); if (reduced) drawConnections(performance.now());
    if (hasChapter) goTo(document.getElementById(id));
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
    selection.classList.remove('is-open'); selection.hidden = true; highlight(); syncSizes(); if(reduced)drawConnections(performance.now());
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
    const viewLeft=-cameraFrame.x/cameraFrame.scale;
    const viewRight=(innerWidth-cameraFrame.x)/cameraFrame.scale;
    const first = Math.ceil((viewLeft-80-row.offset-local)/row.span);
    const last = Math.floor((viewRight+80-row.offset-local)/row.span);
    return Array.from({length: Math.max(0, last - first + 1)}, (_, i) => ({x: row.offset + local + (first + i) * row.span, top: row.y, bottom: row.y + row.photoHeight}));
  }
  function drawConnections(now) {
    rows.forEach(row => { row.y = row.el.offsetTop + row.viewport.offsetTop + Number(gsap.getProperty(row.el,'y') || 0); });
    lines.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);
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
        markup += `<path class="kin-line" pathLength="1000" style="stroke-dasharray:1000;stroke-dashoffset:${1000*(1-clamp(growth.draw*5-D.generations.findIndex(g=>g.ids.includes(child))+1))}" d="M${a.x},${a.bottom}C${a.x + sway},${mid} ${b.x - sway},${mid} ${b.x},${b.top}"/>`;
      });
    });
    markup += connectionPaths(selected, settled).map(d => `<path class="active-line" pathLength="1000" style="stroke-dasharray:1000;stroke-dashoffset:${1000*(1-growth.draw)}" d="${d}"/>`).join('');
    if (hovered && hovered !== selected) markup += connectionPaths(hovered, false).map(d => `<path class="active-line hover-line" pathLength="1000" style="stroke-dasharray:1000;stroke-dashoffset:${1000*(1-growth.draw)}" d="${d}"/>`).join('');
    lines.innerHTML = markup;
  }


  function syncSizes() {
    const mobile=innerWidth<=700;
    const width=mobile?72:112;
    family.style.setProperty('--tree-photo-width',`${width}px`);
    stage.style.height=`${(mobile?144:188)*5}px`;
    stage.style.width=`${innerWidth}px`;
    rows.forEach(row=>{row.width=width;row.photoHeight=width*1.25;});
    lines.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    applyCamera();
  }
  function applyCamera(){
    if(reduced){stage.style.transform='none';cameraFrame.scale=1;cameraFrame.x=0;return;}
    const viewport=$('.tree-window');
    const height=viewport.clientHeight||innerHeight*.7;
    const worldHeight=(innerWidth<=700?144:188)*5;
    const fit=Math.min(1,(height-10)/worldHeight);
    const blend=camera.overview;
    const scale=camera.zoom*(1-blend)+fit*blend;
    const petr=point('petr'),maria=point('maria',petr.x);
    const pair=(petr.x+maria.x)/2;
    const center=pair*(1-blend)+innerWidth/2*blend;
    const focus=rows[0].photoHeight/2+camera.focus*(innerWidth<=700?144:188);
    const y=(height*.45-focus*scale)*(1-blend)+(height-worldHeight*fit)/2*blend;
    const x=innerWidth/2-center*scale;
    stage.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    cameraFrame.scale=scale;cameraFrame.x=x;
  }
  buildTree();
  addFrame(family,(seconds,delta)=>{
    const now=seconds*1000,dt=delta*1000,frames=dt/(1000/60);
    treeVisible=true;
    if(panelOpening){selection.classList.add('is-open');panelOpening=false;}
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
          } else if (!(locked && row.group) && !reduced && growth.move > 0 && !(drag?.active && drag.row === row)) {
            row.pause = clamp(row.pause + (row.hover ? -1 : 1) * dt / 400);
            row.offset += row.speed * frames * row.pause + row.velocity * frames;
            row.velocity *= Math.pow(.95, frames);
            if (Math.abs(row.velocity) < .01) row.velocity = 0;
            normalize(row);
          }
          normalize(row);
          row.track.style.transform = `translate3d(${row.offset}px,0,0)`;
        });
        applyCamera();drawConnections(now);
        if (locked && !rows.some(row => row.tween || row.geometryTween)) family.classList.remove('is-aligning');
        if (++frame % 120 === 0) setTabStops();
      }

  });
  return {
    resize:()=>{buildTree();drawConnections(0);},
    setReduced:value=>{reduced=value;growth.draw=value?1:0;growth.move=0;camera.zoom=2.4;camera.focus=0;camera.overview=value?1:0;syncSizes();drawConnections(0);},
    animate:()=>{
      const timeline=pinTimeline('tree',220,1);
      growth.draw=0;growth.move=0;
      camera.zoom=2.4;camera.focus=0;camera.overview=0;applyCamera();
      gsap.set('.ribbon',{clipPath:'none',y:0,filter:'brightness(.25)'});
      gsap.set(rows[0].el,{filter:'brightness(1)'});
      gsap.set('.tree-title-char',{yPercent:120});
      timeline.to('.tree-title-char',{yPercent:0,duration:3,stagger:.22},0)
        .to(camera,{zoom:1.85,focus:1,duration:18,onUpdate:applyCamera},0)
        .to(camera,{zoom:1.35,focus:2,duration:16,onUpdate:applyCamera},18)
        .to(camera,{zoom:1.05,focus:3,duration:16,onUpdate:applyCamera},34)
        .to(camera,{zoom:.86,focus:4,duration:12,onUpdate:applyCamera},50)
        .to(camera,{overview:1,duration:8,onUpdate:applyCamera},62)
        .to('.ribbon:not(:first-child)',{filter:'brightness(1)',duration:12,stagger:13},8)
        .to(growth,{draw:1,duration:62},8).to(growth,{move:1,duration:1},70)
        .to({}, {duration:29},71).addLabel('end',100);
      return {timeline};
    }
  };
}
