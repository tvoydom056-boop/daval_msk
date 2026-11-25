import { weddingStory } from '../story-text.js';
import { weddingScenes } from './story-config.js';
import { gsap, ScrollTrigger, $, $$, image, esc } from '../shared.js';

const clamp = value => Math.max(0, Math.min(1, value));

function poster(name) {
  return `<span class="wedding-reading-poster">${image(`story/${name}-bg.jpg`)}${image(`story/${name}-fg.png`)}</span>`;
}

function chapterMarkup(chapter, index) {
  const scene = weddingScenes.find(item => item.id === chapter.id);
  const angle = index % 2 ? 2.3 : -2.3;
  return `<article id="reading-${esc(chapter.id)}" class="wedding-reading-chapter ${index % 2 ? 'photo-right' : 'photo-left'}" style="--chapter-bg:${scene.bg};--chapter-ink:${scene.ink};--chapter-accent:${scene.accent};--print-angle:${angle}deg" aria-labelledby="reading-title-${esc(chapter.id)}">
    <div class="wedding-reading-spread">
      <figure class="wedding-reading-print" data-slot="Кадр-постер главы ${esc(chapter.title)}">
        <div class="wedding-reading-photo ${scene.id === 'before' ? 'double-photo' : ''}" role="img" aria-label="${esc(chapter.title)}">${poster(scene.media)}${scene.id === 'before' ? poster(scene.second) : ''}</div>
        <figcaption>${esc(chapter.year)} · ${esc(chapter.title)}</figcaption>
      </figure>
      <div class="wedding-reading-copy">
        <header class="wedding-reading-chapter-heading"><p class="wedding-reading-year">${esc(chapter.year)}</p><h3 id="reading-title-${esc(chapter.id)}">${esc(chapter.title)}</h3></header>
        <div class="wedding-reading-paragraphs">${chapter.paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}</div>
        ${chapter.voice ? `<aside class="wedding-reading-voice" style="--note-angle:${index % 2 ? -2.5 : 2.5}deg" aria-label="Записка: ${esc(chapter.voice[0])}"><p>${esc(chapter.voice[1])}</p><p class="wedding-reading-sign">${esc(chapter.voice[0])}</p></aside>` : ''}
      </div>
    </div>
  </article>`;
}

export function weddingReadingMarkup() {
  const first = weddingScenes[0], last = weddingScenes.at(-1);
  return `<section id="wedding-reading" class="wedding-reading" style="--reading-bg:${first.bg};--reading-ink:${first.ink};--reading-accent:${first.accent}" aria-labelledby="wedding-reading-title">
    <header class="wedding-reading-opening">
      <p class="wedding-reading-kicker">Вся история</p><h2 id="wedding-reading-title">${esc(weddingStory.title)}</h2>
      <p class="wedding-reading-lead">${esc(weddingStory.lead)}</p><p class="wedding-reading-by">${esc(weddingStory.by)}</p>
    </header>
    ${weddingStory.chapters.map(chapterMarkup).join('')}
    <footer class="wedding-reading-finale" style="--chapter-bg:${last.bg};--chapter-ink:${last.ink};--chapter-accent:${last.accent}"><p>За них.</p></footer>
  </section>`;
}

export function mountWeddingReading(reduced) {
  const root = $('#wedding-reading');
  if (!root) return null;
  const chapters = $$('.wedding-reading-chapter', root), body = document.body;
  const first = weddingScenes[0];
  const blends = weddingScenes.map((scene, index) => gsap.utils.interpolate(weddingScenes[Math.max(0, index - 1)].bg, scene.bg));
  let chapterTops = [];

  function measure() {
    chapterTops = chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY);
  }

  function updateTheme(trigger) {
    let scene = first, color = first.bg;
    const start = innerHeight * .85, span = innerHeight * .4;
    chapterTops.forEach((top, index) => {
      const distance = top - scrollY;
      if (distance < start) {
        color = blends[index](clamp((start - distance) / span));
        if (distance <= innerHeight * .55) scene = weddingScenes[index];
      }
    });
    if (!reduced) root.style.backgroundColor = color;
    body.classList.toggle('wedding-reading-active', trigger.isActive);
    body.style.setProperty('--reading-nav-bg', reduced ? scene.bg : color);
    body.style.setProperty('--reading-nav-ink', scene.ink);
    body.style.setProperty('--reading-nav-accent', scene.accent);
  }

  measure();
  const themeTrigger = ScrollTrigger.create({
    trigger: root, start: 'top 78px', end: 'bottom 78px',
    onUpdate: updateTheme, onToggle: updateTheme,
    onRefresh: trigger => { measure(); updateTheme(trigger); },
  });

  if (!reduced) {
    chapters.forEach(chapter => {
      const print = $('.wedding-reading-print', chapter), note = $('.wedding-reading-voice', chapter);
      gsap.fromTo(print, { y: 22 }, {
        y: -22, ease: 'none',
        scrollTrigger: { trigger: chapter, start: 'top bottom', end: 'bottom top', scrub: .7 },
      });
      if (note) {
        gsap.fromTo(note, { opacity: 0, y: 18, scale: .96, rotation: -3 }, {
          opacity: 1, y: 0, scale: 1, rotation: 0, duration: .7, ease: 'power2.out',
          scrollTrigger: { trigger: note, start: 'top 90%', once: true },
        });
      }
    });
  }

  return { destroy() {
    themeTrigger.kill();
    body.classList.remove('wedding-reading-active');
    ['--reading-nav-bg', '--reading-nav-ink', '--reading-nav-accent'].forEach(name => body.style.removeProperty(name));
  } };
}
