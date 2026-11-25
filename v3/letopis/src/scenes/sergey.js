import {gsap,$,vh,vw,pinTimeline,sceneVideo,prop,emphasis,drawPaths} from '../lib/core.js';
import {chapters} from '../data.js';
import {words,quoteReveal,revealLines} from '../lib/text.js';

const data=chapters.find(chapter=>chapter.id==='sergey');
const shapes={0:'abcedf',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgecd',7:'abc',8:'abcdefg',9:'abfgcd'};
function digit(number,className='') {return `<span class="segment-digit ${className}" data-digit="${number}">${[...'abcdefg'].map(segment=>`<i class="segment segment-${segment}${shapes[number].includes(segment)?' is-lit':''}"></i>`).join('')}</span>`;}
function updateDigit(element,number) {if(element.dataset.digit===String(number))return;element.dataset.digit=number;[...element.children].forEach(segment=>segment.classList.toggle('is-lit',shapes[number].includes(segment.classList[1].slice(-1))));}
export function mountSergey() {
  $('#lower').insertAdjacentHTML('beforebegin',`<section id="sergey" class="film-scene football-chapter" data-scene="sergey" data-pin-vh="560" aria-labelledby="sergey-title"><div class="scene-stage">
    <div class="scene-background football-video">${sceneVideo('football')}</div><div class="stadium-dark"></div><div class="scene-shade"></div>
    <p class="chapter-label" id="sergey-title">Глава третья · Сергей Николаевич · род. 1958 <span class="self-story">Рассказывает сам</span></p>
    <div class="scoreboard" aria-label="Строитель 1:1 Гости"><div class="score-teams"><span>Строитель</span><span>Гости</span></div><div class="score-numbers"><span class="home-score">${digit(1,'score-old')}${digit(2,'score-new')}</span><b class="score-colon">:</b>${digit(1,'away-score')}</div><div class="match-clock" aria-label="86:00">${digit(8)}${digit(6)}<b>:</b>${digit(0)}${digit(0)}</div></div>
    <div class="goal-flash" aria-hidden="true"></div>
    <div class="scene-copy winning-copy" data-lines>${emphasis(data.captions[1])}</div>
    <div class="floodlight floodlight-left" aria-hidden="true"></div><div class="floodlight floodlight-right" aria-hidden="true"></div>
    <div class="rolling-ball"><i class="ball-shadow" aria-hidden="true"></i>${prop('ball','Кожаный мяч')}</div>
    <figure class="team-frame">${prop('teamphoto','Команда «Строитель», 1979')}<svg class="player-mark" viewBox="0 0 900 675" fill="none" aria-hidden="true"><path class="player-circle" d="M387 282C394 221 510 220 520 285C533 350 405 379 383 313C376 295 381 275 390 265"/><path class="player-leader" d="M513 262L660 75H818"/></svg><figcaption>Сергей, №7</figcaption></figure>
    <div class="scene-copy team-copy" data-lines>${emphasis(data.captions[0])}</div>
    <div class="yard-evening"></div>${prop('boots','Бутсы правого полузащитника','yard-boots')}
    <div class="pennant-rope" aria-hidden="true"></div>${prop('pennant','Вымпел команды','yard-pennant')}
    <div class="scene-copy coach-copy" data-lines>${emphasis(data.captions[2])}</div>
    <div class="scene-quote football-quote"><blockquote>${data.quote}</blockquote><p class="quote-source">${data.credit}</p></div>
    <div class="morning-flash" aria-hidden="true"></div>
  </div></section>`);
  words($('#sergey blockquote'));
}
export function animateSergey() {
  const timeline=pinTimeline('sergey',560);
  const clock=$('.match-clock'),digits=[...clock.querySelectorAll('.segment-digit')],time={seconds:86*60};
  const updateClock=()=>{const value=Math.floor(time.seconds),formatted=`${String(Math.floor(value/60)).padStart(2,'0')}${String(value%60).padStart(2,'0')}`;digits.forEach((element,index)=>updateDigit(element,Number(formatted[index])));clock.setAttribute('aria-label',formatted.slice(0,2)+':'+formatted.slice(2));};
  updateClock();
  gsap.set('.football-video',{clipPath:'inset(0% 50% 0% 50%)'});
  gsap.set('.football-video video',{scale:1.12});
  gsap.set('.score-new',{rotationX:90,opacity:0,transformOrigin:'50% 0%'});
  gsap.set('.goal-flash,.winning-copy,.rolling-ball,.team-frame,.team-copy,.yard-evening,.yard-boots,.yard-pennant,.pennant-rope,.coach-copy,.football-quote,.morning-flash',{opacity:0});
  gsap.set('.rolling-ball',{x:-vw(20)});
  gsap.set('.team-frame',{y:-vh(80),rotation:6});
  gsap.set('.yard-boots',{x:-vw(20),rotation:-8});
  gsap.set('.yard-pennant',{y:-vh(70),rotation:7,transformOrigin:'50% 0%'});
  timeline.addLabel('score',0).to(time,{seconds:87*60+59,duration:15,onUpdate:updateClock},0)
    .addLabel('goal',15).to(time,{seconds:88*60,duration:.1,onUpdate:updateClock},15)
    .to('.score-old',{rotationX:-90,opacity:0,transformOrigin:'50% 100%',duration:1.2},15)
    .to('.score-new',{rotationX:0,opacity:1,duration:1.2},15.6)
    .to('.goal-flash',{opacity:.3,duration:.12},15.4).to('.goal-flash',{opacity:0,duration:.3},15.52)
    .to('.football-video',{clipPath:'inset(0% 0% 0% 0%)',duration:14},16)
    .to('.stadium-dark',{opacity:0,duration:14},16)
    .to('.scoreboard',{y:()=>-vh(70),opacity:0,duration:13},17)
    .to('.winning-copy',{opacity:1,duration:3},22)
    .to('.football-video video',{scale:1.04,x:()=>-vw(3),duration:70},30);
  revealLines(timeline,'.winning-copy',22,3,1);
  timeline.addLabel('ball',30).to('.rolling-ball',{opacity:1,duration:1},30)
    .to('.rolling-ball',{x:()=>vw(120),duration:18},30)
    .to('.rolling-ball img',{rotation:720,duration:18},30)
    .to('.floodlight-left',{opacity:.6,duration:6},30).to('.floodlight-left',{opacity:.25,duration:6},36)
    .to('.floodlight-right',{opacity:.5,duration:6},36).to('.floodlight-right',{opacity:.2,duration:6},42)
    .to('.winning-copy',{opacity:0,duration:4},44)
    .addLabel('team',48).to('.team-frame',{y:0,rotation:-2,opacity:1,duration:9,ease:'power2.out'},48)
    .to('.team-copy',{opacity:1,duration:2},54);
  drawPaths(timeline,'.player-mark path',56,5,.5);
  revealLines(timeline,'.team-copy',54,3,1);
  timeline.to('.team-frame figcaption',{opacity:1,duration:2},60)
    .addLabel('coach',66).to('.team-frame',{y:()=>vh(60),rotation:5,opacity:0,duration:7},66)
    .to('.team-copy',{opacity:0,duration:4},66).to('.yard-evening',{opacity:.55,duration:8},66)
    .to('.yard-boots',{x:0,rotation:-2,opacity:1,duration:7},67)
    .to('.pennant-rope',{opacity:1,duration:3},67)
    .to('.yard-pennant',{y:0,opacity:1,rotation:-5,duration:7,ease:'power2.out'},67)
    .to('.yard-pennant',{rotation:4,duration:5,ease:'sine.inOut'},74).to('.yard-pennant',{rotation:-1,duration:5,ease:'sine.out'},79)
    .to('.coach-copy',{opacity:1,duration:2},70);
  revealLines(timeline,'.coach-copy',70,3,1);
  timeline.addLabel('words',84).to('.yard-boots,.yard-pennant,.pennant-rope,.coach-copy',{opacity:0,duration:5},84)
    .to('.football-quote',{opacity:1,duration:2},86);
  quoteReveal(timeline,'.football-quote',86,2,.55);
  timeline.to('.morning-flash',{opacity:0,duration:4},96).addLabel('end',100);
  return {timeline};
}
export function setStaticSergey() {
  const clock=$('.match-clock');
  [...clock.querySelectorAll('.segment-digit')].forEach((element,index)=>updateDigit(element,[8,8,0,0][index]));
  clock.setAttribute('aria-label','88:00');
  $('.scoreboard').setAttribute('aria-label','Строитель 2:1 Гости');
}
