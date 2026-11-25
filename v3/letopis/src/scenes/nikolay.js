import {gsap,$,vh,vw,pinTimeline,sceneVideo,prop,emphasis,drawPaths} from '../lib/core.js';
import {chapters} from '../data.js';
import {words,counter,quoteReveal,revealLines} from '../lib/text.js';
import {particles} from '../lib/particles.js';

const data=chapters.find(chapter=>chapter.id==='nikolay');
export function mountNikolay() {
  const truss=Array.from({length:11},(_,index)=>{
    const x=100+index*100,y=450-320*Math.sin(Math.PI*index/10);
    const nx=x+100,ny=450-320*Math.sin(Math.PI*(index+1)/10);
    return `<path d="M${x} ${y}V450${index<10?`L${nx} ${ny}`:''}"/>`;
  }).join('');
  const points=Array.from({length:14},(_,index)=>`<span class="route-dot" style="--point:${index};--tier:${index%3}"><i></i><b>${Math.round(1958+index*29/13)}</b></span>`).join('');
  $('#lower').insertAdjacentHTML('beforebegin',`<section id="nikolay" class="film-scene bridge-chapter" data-scene="nikolay" data-pin-vh="600" aria-labelledby="nikolay-title"><div class="scene-stage">
    <div class="scene-background bridge-video">${sceneVideo('bridge')}</div><div class="bridge-blueprint"></div><div class="scene-shade"></div>
    <p class="chapter-label" id="nikolay-title">Глава вторая · Николай Петрович · 1931-2019</p>
    <svg class="bridge-drawing" viewBox="0 0 1200 660" fill="none" aria-label="Чертёж арочного моста, пролёт 412 метров"><g class="technical-lines"><path d="M100 450Q600 -190 1100 450M100 450H1100M100 468H1100"/>${truss}<path d="M180 450V550H230V450M970 450V550H1020V450M100 565H1100M100 550V580M1100 550V580"/></g></svg>
    <p class="bridge-length">412 м</p><div class="scene-copy bridge-intro" data-lines>${emphasis(data.captions[0])}</div>
    <canvas class="welding-sparks" aria-hidden="true"></canvas>
    <span class="bridge-year" aria-hidden="true">1967</span>
    <figure class="brigade-frame">${prop('brigade','Бригада, 1967')}<i class="photo-pin" aria-hidden="true"></i><figcaption>Бригада, 1967</figcaption></figure>
    <div class="scene-copy brigade-copy" data-lines>${emphasis(data.captions[1])}</div>
    <div class="bridge-night"></div>
    <div class="bridge-route" aria-label="14 объектов от Урала до Енисея"><span class="route-start">Урал</span><span class="route-end">Енисей</span><svg viewBox="0 0 1200 30" preserveAspectRatio="none" aria-hidden="true"><path d="M84 15H1116"/></svg>${points}</div>
    <div class="route-counter"><span class="scene-number" data-object-count>1</span><span class="eyebrow">объектов</span></div>
    <div class="scene-copy route-copy" data-lines>${emphasis(data.captions[2])}</div>
    ${prop('caliper','Тот самый штангенциркуль','bridge-caliper')}
    <div class="caliper-measure"><svg viewBox="0 0 180 90" aria-hidden="true"><path d="M0 85L65 15H175"/></svg><span>0,1 мм</span></div>
    <div class="scene-copy caliper-copy" data-lines>${emphasis(data.captions[3])}</div>
    ${prop('helmet','Строительная каска','bridge-helmet')}
    <div class="scene-quote bridge-quote"><blockquote>${data.quote}</blockquote><p class="quote-source">${data.credit}</p></div><div class="bridge-evening"></div>
    <div class="scene-fog bridge-fog" aria-hidden="true"><canvas class="procedural-fog"></canvas></div>
  </div></section>`);
  words($('#nikolay blockquote'));particles($('#nikolay .welding-sparks'),{origin:()=>innerWidth<768?[.14,.3]:[.4,.31]});
}
export function animateNikolay({mobile}) {
  const timeline=pinTimeline('nikolay',600);
  gsap.set('.bridge-video',{clipPath:'inset(0% 50% 0% 50%)'});
  gsap.set('.bridge-video video',{scale:1.15,x:vw(5)});
  gsap.set('.bridge-length,.welding-sparks,.bridge-year,.brigade-frame,.brigade-copy,.bridge-night,.bridge-route,.route-counter,.route-copy,.bridge-caliper,.caliper-measure,.caliper-copy,.bridge-helmet,.bridge-quote,.bridge-evening',{opacity:0});
  gsap.set('.brigade-frame',{y:vh(70),rotation:9,rotationX:18});
  gsap.set('.photo-pin',{scale:3,opacity:0,y:-35});
  gsap.set('.route-dot',{opacity:.1});
  gsap.set('.bridge-caliper',{x:-vw(80),y:vh(25),rotation:-20});
  gsap.set('.bridge-helmet',{y:vh(20),rotation:-7});
  timeline.addLabel('blueprint',0);
  drawPaths(timeline,'.technical-lines path',0,10,.2);
  timeline.to('.bridge-length',{opacity:1,duration:4},7);
  revealLines(timeline,'.bridge-intro',5,4,1);
  timeline.addLabel('bridge',15)
    .to('.bridge-video',{clipPath:'inset(0% 0% 0% 0%)',duration:20},15)
    .to('.bridge-video video',{x:()=>-vw(10),scale:1.05,duration:85},15)
    .to('.bridge-blueprint',{opacity:0,duration:15},15)
    .to('.bridge-drawing',{x:()=>vw(mobile?12:7.5),y:()=>vh(mobile?-5:2.5),scale:mobile?2.7:1.3,duration:20},15)
    .to('.bridge-drawing,.bridge-length,.bridge-intro',{opacity:0,duration:15},20)
    .to('.welding-sparks',{opacity:1,duration:4},19)
    .to('.welding-sparks',{opacity:0,duration:3},32)
    .addLabel('brigade',35)
    .to('.bridge-year',{opacity:.15,x:()=>-vw(3),duration:12},35)
    .to('.brigade-frame',{y:0,rotation:-3,rotationX:0,opacity:1,duration:11,ease:'power2.out'},35)
    .to('.photo-pin',{scale:1,y:0,opacity:1,duration:1.5,ease:'back.out(1.6)'},45)
    .to('.brigade-copy',{opacity:1,duration:2},39);
  revealLines(timeline,'.brigade-copy',39,3,1.2);
  timeline.addLabel('route',52)
    .to('.brigade-frame',{x:()=>vw(20),y:()=>-vh(12),scale:.7,opacity:0,duration:7},52)
    .to('.brigade-copy,.bridge-year',{opacity:0,duration:5},52)
    .to('.bridge-night',{opacity:.68,duration:7},52)
    .to('.bridge-route,.route-counter,.route-copy',{opacity:1,duration:4},54);
  drawPaths(timeline,'.bridge-route path',53,16,0);
  timeline.to('.route-dot',{opacity:1,duration:1,stagger:1.05},55);
  counter(timeline,$('[data-object-count]'),1,14,55,15);
  revealLines(timeline,'.route-copy',57,3,1.2);
  timeline.addLabel('caliper',72)
    .to('.bridge-route,.route-counter,.route-copy',{opacity:0,duration:5},72)
    .to('.bridge-caliper',{x:0,y:0,rotation:-4,opacity:1,duration:9,ease:'power2.out'},72)
    .to('.caliper-measure,.caliper-copy',{opacity:1,duration:4},77);
  drawPaths(timeline,'.caliper-measure path',77,4,0);
  revealLines(timeline,'.caliper-copy',77,3,1);
  timeline.addLabel('words',88)
    .to('.bridge-caliper,.caliper-measure,.caliper-copy',{opacity:0,y:()=>vh(12),duration:4},88)
    .to('.bridge-helmet',{opacity:.68,y:0,duration:6},88)
    .to('.bridge-quote',{opacity:1,duration:2},89);
  quoteReveal(timeline,'.bridge-quote',89,2,.45);
  timeline.to('.bridge-evening',{opacity:.5,duration:5},95).addLabel('end',100);
  return {timeline};
}
