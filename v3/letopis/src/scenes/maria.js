import {gsap,$,$$,vh,vw,pinTimeline,sceneVideo,prop,emphasis,drawPaths,escapeHTML} from '../lib/core.js';
import {chapters} from '../data.js';
import {words,letters,quoteReveal,counter,revealLines} from '../lib/text.js';
import {particles} from '../lib/particles.js';

const data=chapters.find(chapter=>chapter.id==='maria');
const cities=['Тамбов','Москва','Казань','Самара','Пермь','Омск'];
function handwriting(text) {
  return text.split(' ').map(word=>`<span class="write-word${word==='туман.'?' checked-word':''}">${[...word].map(char=>`<span class="ink-char">${escapeHTML(char)}</span>`).join('')}${word==='туман.'?'<svg class="red-underline" viewBox="0 0 120 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8Q54 4 118 9"/></svg>':''}</span>`).join(' ');
}
export function mountMaria() {
  const envelopes=cities.map((city,index)=>{const angle=index*Math.PI/3;return `<figure class="school-envelope" style="--x:${Math.cos(angle)};--y:${Math.sin(angle)}">${prop('envelope','Письмо бывшего ученика')}<figcaption>${city}</figcaption></figure>`;}).join('');
  $('#lower').insertAdjacentHTML('beforebegin',`<section id="maria" class="film-scene school-chapter" data-scene="maria" data-pin-vh="560" aria-labelledby="maria-title"><div class="scene-stage">
    <div class="scene-background school-video">${sceneVideo('school')}</div><div class="chalkboard"></div><div class="school-shade"></div>
    <p class="chapter-label">Глава четвёртая</p>
    <div class="chalk-heading"><h2 id="maria-title"><span class="chalk-word">Мария</span> <span class="chalk-word">Соколова</span></h2><p class="chalk-years">1912-1998 · учительница</p></div>
    <canvas class="chalk-dust" aria-hidden="true"></canvas><div class="sunbeam" aria-hidden="true"></div>
    <div class="scene-copy teacher-copy" data-lines>${emphasis(data.captions[0])}</div>
    <article class="school-notebook" aria-label="Школьный диктант"><img src="./media/notebook-open.jpg" width="2000" height="1400" alt="Раскрытая школьная тетрадь 1950-х годов" loading="lazy" data-slot="Раскрытая тетрадь"><div class="dictation"><p>${handwriting('Диктант.')}</p><p>${handwriting('Осень. Над рекой стоит туман.')}</p><p>${handwriting('Скоро зима.')}</p></div><span class="teacher-grade" aria-label="Оценка пять">5</span></article>
    <div class="school-globe">${prop('globe','Школьный глобус')}<div class="globe-metal" aria-hidden="true"><i class="globe-glint"></i></div></div>
    <div class="teacher-counter"><span class="scene-number" data-years-count>1</span><span class="eyebrow">год у школьной доски</span></div>
    <div class="scene-copy wartime-copy" data-lines>${emphasis(data.captions[1])}</div>
    <div class="student-letters">${envelopes}<div class="envelope-copy" data-lines>${emphasis(data.captions[2])}</div></div>
    <div class="scene-quote school-quote"><blockquote>${data.quote}</blockquote><p class="quote-source">${data.credit}</p></div>
    <div class="scene-fog school-fog" aria-hidden="true"><canvas class="procedural-fog"></canvas></div><div class="school-paper" aria-hidden="true"></div>
  </div></section>`);
  $$('.chalk-word').forEach(element=>letters(element));words($('#maria blockquote'));
  particles($('#maria .chalk-dust'),{type:'chalk',count:55,origin:[.5,.36]});
  $('.globe-metal').style.setProperty('--globe-mask',`url("${new URL('./media/globe.png',document.baseURI).href}")`);
}
export function animateMaria({mobile}) {
  const timeline=pinTimeline('maria',560);
  gsap.set('.chalk-heading .written-char',{clipPath:'inset(0% 100% 0% 0%)'});
  gsap.set('.chalk-years',{opacity:0});
  gsap.set('.school-video video',{scale:1.3,y:vh(6)});
  gsap.set('.teacher-copy,.sunbeam,.school-notebook,.school-globe,.teacher-counter,.wartime-copy,.student-letters,.school-quote,.school-paper',{opacity:0});
  gsap.set('.school-notebook',{y:vh(60),rotationX:35,rotationZ:-3});
  gsap.set('.ink-char',{clipPath:'inset(0% 100% 0% 0%)'});
  gsap.set('.teacher-grade',{opacity:0,scale:1.5,rotation:-8});
  gsap.set('.school-globe',{rotation:-7,x:-vw(15)});
  gsap.set('.globe-glint',{xPercent:-100});
  gsap.set('.school-envelope',{xPercent:-50,yPercent:-50,x:index=>(index%2?1:-1)*vw(90),y:index=>(index<3?-1:1)*vh(70),rotation:index=>index*11-30});
  timeline.addLabel('chalk',0)
    .to('.chalk-heading .written-char',{clipPath:'inset(0% 0% 0% 0%)',duration:1.4,stagger:.52},1)
    .to('.chalk-years',{opacity:1,duration:4},10)
    .addLabel('classroom',15)
    .to('.chalkboard,.chalk-heading,.chalk-dust',{opacity:0,y:()=>-vh(9),duration:17},15)
    .to('.school-video video',{scale:1.05,y:0,duration:17},15)
    .to('.sunbeam',{opacity:.55,duration:17},15)
    .to('.teacher-copy',{opacity:1,duration:3},20);
  revealLines(timeline,'.teacher-copy',20,3,1.2);
  timeline.addLabel('dictation',32).to('.teacher-copy',{opacity:0,duration:5},32)
    .to('.school-notebook',{y:0,rotationX:12,opacity:1,duration:10,ease:'power2.out'},32)
    .to('.school-shade',{opacity:.45,duration:8},32)
    .to('.ink-char',{clipPath:'inset(0% 0% 0% 0%)',duration:.9,stagger:.18},40);
  drawPaths(timeline,'.red-underline path',50,2,0);
  timeline.to('.teacher-grade',{opacity:1,scale:1,duration:1.3,ease:'power2.out'},52)
    .addLabel('forty-one',55).to('.school-notebook',{y:()=>vh(65),rotationX:28,opacity:0,duration:7},55)
    .to('.school-globe',{x:0,rotation:0,opacity:1,duration:7},55)
    .to('.school-globe',{rotation:7,duration:10},62)
    .to('.globe-glint',{xPercent:100,duration:17},55)
    .to('.teacher-counter,.wartime-copy',{opacity:1,duration:3},58);
  counter(timeline,$('[data-years-count]'),1,41,57,13);
  revealLines(timeline,'.wartime-copy',59,3,1.2);
  timeline.addLabel('students',72).to('.school-globe,.teacher-counter,.wartime-copy',{opacity:0,duration:5},72)
    .to('.student-letters',{opacity:1,duration:2},73)
    .to('.school-envelope',{x:0,y:0,rotation:index=>[-5,4,-3,6,-4,3][index],duration:8,stagger:.8,ease:'power2.out'},73);
  revealLines(timeline,'.envelope-copy',77,3,1);
  timeline.addLabel('words',88).to('.student-letters',{opacity:0,scale:1.15,duration:4},88)
    .to('.school-shade',{opacity:.78,duration:4},88).to('.sunbeam',{opacity:.15,duration:4},88)
    .to('.school-quote',{opacity:1,duration:2},89);
  quoteReveal(timeline,'.school-quote',89,2,.36);
  timeline.to('.school-paper',{opacity:1,duration:3.2},96.8).addLabel('end',100);
  return {timeline};
}
