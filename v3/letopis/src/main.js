import './style.css';
import './scenes.css';
import './presentation.css';
import './tree.css';
import './embed.css';
import './book.css';
import './flow.css';
import './navigation.css';
import './lib/style-audit.js';
import Lenis from 'lenis';
import {gsap,ScrollTrigger,$,$$,initMedia,setMediaReduced,loadMedia} from './lib/core.js';
import {words,splitLines,odometer} from './lib/text.js';
import {initGrain} from './lib/grain.js';
import {mountAtmosphere} from './lib/atmosphere.js';
import {animateHero} from './scenes/hero.js';
import {mountTree,initTree} from './scenes/tree.js';
import {animatePetr} from './scenes/petr.js';
import {mountNikolay,animateNikolay} from './scenes/nikolay.js';
import {mountSergey,animateSergey,setStaticSergey} from './scenes/sergey.js';
import {mountMaria,animateMaria} from './scenes/maria.js';
import {mountSections,animateSections,animateBenefits} from './scenes/sections.js';
import {mountChapterTransitions,animateChapterTransition,animatePageExits} from './lib/transitions.js';
import {mountBook,animateBook} from './scenes/book.js';
import {initNavigation} from './lib/navigation.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let lenis,contexts=[],timelines=[],intro,ticker;
let atmosphereMounted=false;
mountTree();mountNikolay();mountSergey();mountMaria();mountSections();
mountBook();
mountChapterTransitions();
$$('#petr .front-copy,#petr .medal-copy').forEach(element=>element.dataset.lines='');
words($('#petr blockquote'));
$('.medal-metal').style.setProperty('--medal-mask','url("'+new URL('./media/medal.png',document.baseURI).href+'")');
const tree=initTree({goTo});
initNavigation({getLenis:()=>lenis});
const definitions=[
  ['hero',animateHero],['tree',()=>tree.animate()],['petr',animatePetr],
  ['nikolay',animateNikolay],['sergey',animateSergey],['maria',animateMaria],
  ['restoration',animateSections],['benefits',animateBenefits]
];

function goTo(target,{immediate=false}={}) {
  if(!target)return;
  const trigger=ScrollTrigger.getById(target.id);
  const position=trigger?trigger.start+(target.id==='tree'?(trigger.end-trigger.start)*(innerWidth<768?.82:.78):['petr','nikolay','sergey','maria'].includes(target.id)?innerHeight*.75:0):target;
  if(lenis)lenis.scrollTo(position,{duration:1.6,immediate,force:true});
  else target.scrollIntoView({behavior:'instant',block:'start'});
}
document.addEventListener('click',event=>{
  const treeButton=event.target.closest('[data-go-tree]');
  if(treeButton){goTo($('#tree'));return;}
  const link=event.target.closest('a[href^="#"]');
  if(link&&link.hash){const target=$(link.hash);if(target){event.preventDefault();goTo(target);}}
});
function metrics() {
  return definitions.map(([id])=>{
    const trigger=ScrollTrigger.getById(id);
    if(!trigger)return null;
    const root=document.getElementById(id);
    const stage=id==='hero'?root:root.querySelector('.scene-stage');
    return {id,start:trigger.start,end:trigger.end,length:trigger.end-trigger.start,progress:trigger.progress,pinVh:Number(root.dataset.pinVh),naturalHeight:stage.offsetHeight};
  }).filter(Boolean);
}
function layout() {
  const pins=metrics();
  const unpinned=$$('#lower > .paper-section:not([data-pin-vh]), .book-page, .restoration-notes, .site-footer').map(element=>({id:element.id||element.className,height:element.offsetHeight}));
  const natural=pins.reduce((sum,pin)=>sum+pin.naturalHeight,0);
  const pinLength=pins.reduce((sum,pin)=>sum+pin.length,0);
  const sections=unpinned.reduce((sum,section)=>sum+section.height,0);
  return {pins,unpinned,natural,pinLength,sections,expected:natural+pinLength+sections,actual:document.documentElement.scrollHeight,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth};
}
async function prepare(id) {
  const root=document.getElementById(id);
  if(!root)return;
  if(!reduced.matches)$$('video',root).forEach(video=>{video.preload='auto';});
  loadMedia(root);
  $$('img',root).forEach(image=>image.loading='eager');
  await Promise.all($$('img',root).map(image=>image.decode().catch(()=>{})));
  if(reduced.matches)return;
  await Promise.all($$('video',root).map(video=>video.readyState>=2?Promise.resolve():new Promise(resolve=>{
    video.addEventListener('loadeddata',resolve,{once:true});
    video.addEventListener('error',resolve,{once:true});
    setTimeout(resolve,12000);
  })));
}
function rebuild(preserve=true) {
  const scroll=window.scrollY;
  const previous=metrics().find(pin=>scroll>=pin.start&&scroll<=pin.end);
  const previousProgress=previous?(scroll-previous.start)/previous.length:0;
  contexts.forEach(context=>context.revert());contexts=[];timelines=[];
  document.documentElement.classList.toggle('motion-ready',!reduced.matches);
  tree.setReduced(reduced.matches);
  tree.resize();
  $$('[data-lines],[data-paper-lines]').forEach(splitLines);
  setMediaReduced(reduced.matches);
  if(reduced.matches){
    odometer($('.year'))(1941);$('.count-number').textContent='37';
    $('[data-object-count]').textContent='14';$('[data-years-count]').textContent='41';
    setStaticSergey();
    window.__film={ready:true,reducedMotion:true,metrics:()=>[],layout:()=>({overflow:document.documentElement.scrollWidth-innerWidth,actual:document.documentElement.scrollHeight}),prepare,settle:()=>{}};
    return;
  }
  definitions.forEach(([id,animate])=>{
    const scope=id==='restoration'?$('#lower'):document.getElementById(id);
    contexts.push(gsap.context(()=>{
      const result=animate({mobile:innerWidth<768});
      if(['petr','nikolay','sergey','maria'].includes(id))animateChapterTransition(result.timeline);
      timelines.push(result.timeline);
      if(result.intro)intro=result.intro;
    },scope));
  });
  contexts.push(gsap.context(animateBook,$('main')));
  contexts.push(gsap.context(animatePageExits,$('main')));
  ScrollTrigger.refresh();
  if(preserve){
    intro?.progress(1);
    const trigger=previous&&ScrollTrigger.getById(previous.id);
    lenis.scrollTo(trigger?trigger.start+(trigger.end-trigger.start)*previousProgress:scroll,{immediate:true,force:true});
    ScrollTrigger.update();
  }
  window.__film={
    ready:true,reducedMotion:false,metrics,layout,prepare,
    settle:()=>{intro?.progress(1);ScrollTrigger.update();timelines.forEach(timeline=>timeline.scrollTrigger?.getTween()?.progress(1));},
  };
}
function startLenis() {
  if(reduced.matches)return;
  lenis=new Lenis({lerp:.085,smoothWheel:true,syncTouch:false});
  window.__lenis=lenis;lenis.on('scroll',ScrollTrigger.update);
  ticker=time=>lenis.raf(time*1000);gsap.ticker.add(ticker);gsap.ticker.lagSmoothing(0);
}
await document.fonts.ready;
function ensureAtmosphere(){if(!reduced.matches&&!atmosphereMounted){mountAtmosphere();atmosphereMounted=true;}}
startLenis();rebuild(false);initMedia();ensureAtmosphere();initGrain(reduced);
let resizeTimer;
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>rebuild(true),220);},{passive:true});
reduced.addEventListener('change',()=>{
  if(ticker)gsap.ticker.remove(ticker);
  lenis?.destroy();lenis=undefined;window.__lenis=undefined;
  startLenis();rebuild(false);ensureAtmosphere();
});
if(location.hash&&$(location.hash))goTo($(location.hash),{immediate:true});
