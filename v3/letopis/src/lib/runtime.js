import Lenis from 'lenis';
import {gsap,ScrollTrigger,$,$$,initMedia,setMediaReduced,loadMedia} from './core.js';
import {splitLines} from './text.js';
import {initGrain} from './grain.js';
import {mountAtmosphere} from './atmosphere.js';
import {initNavigation} from './navigation.js';
import {animateBook} from '../scenes/book.js';
import {animatePageExits,animateChapterTransition} from './transitions.js';

export async function startRuntime({definitions=[],tree,book=false,onStatic=()=>{},onReady=()=>{}}={}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let lenis,ticker,intro,contexts=[],timelines=[],atmosphere=false;
  function goTo(target,{immediate=false}={}){
    if(!target)return;
    const trigger=ScrollTrigger.getById(target.id);
    const position=trigger?trigger.start+(target.id==='tree'?(trigger.end-trigger.start)*.78:['petr','nikolay','sergey','maria'].includes(target.id)?innerHeight*.75:0):target;
    if(lenis)lenis.scrollTo(position,{duration:1.5,immediate,force:true});
    else target.scrollIntoView({behavior:'instant',block:'start'});
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-go-tree]')){goTo($('#tree'));return;}
    const link=event.target.closest('a[href]');if(!link)return;
    const url=new URL(link.href,location.href);
    const here=location.pathname.endsWith('/')?location.pathname+'index.html':location.pathname;
    if(url.origin===location.origin&&url.pathname===here&&url.hash&&(!url.search||url.search===location.search)){
      const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if(target){event.preventDefault();goTo(target);history.replaceState(null,'',url.hash);}
    }
  });
  initNavigation({getLenis:()=>lenis});
  function metrics(){return definitions.map(([id])=>{
    const trigger=ScrollTrigger.getById(id),root=document.getElementById(id);if(!trigger)return null;
    return {id,start:trigger.start,end:trigger.end,length:trigger.end-trigger.start,progress:trigger.progress,pinVh:Number(root.dataset.pinVh||0)};
  }).filter(Boolean);}
  async function prepare(id){
    const root=document.getElementById(id);if(!root)return;
    loadMedia(root);$$('img',root).forEach(img=>img.loading='eager');
    await Promise.all($$('img',root).map(img=>img.decode().catch(()=>{})));
    if(!reduced.matches)await Promise.all($$('video',root).map(video=>video.readyState>=2?Promise.resolve():new Promise(resolve=>{
      video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',resolve,{once:true});setTimeout(resolve,12000);
    })));
  }
  function rebuild(preserve=true){
    const y=scrollY,previous=metrics().find(pin=>y>=pin.start&&y<=pin.end),progress=previous?(y-previous.start)/previous.length:0;
    contexts.forEach(context=>context.revert());contexts=[];timelines=[];
    document.documentElement.classList.toggle('motion-ready',!reduced.matches);
    tree?.setReduced(reduced.matches);tree?.resize();
    $$('[data-lines],[data-paper-lines]').forEach(splitLines);setMediaReduced(reduced.matches);
    if(reduced.matches)onStatic();
    else{
      definitions.forEach(([id,animate])=>{
        const root=document.getElementById(id);if(!root)return;
        contexts.push(gsap.context(()=>{
          const result=animate({mobile:innerWidth<768});
          if(['petr','nikolay','sergey','maria'].includes(id))animateChapterTransition(result.timeline);
          if(result?.timeline)timelines.push(result.timeline);if(result?.intro)intro=result.intro;
        },root));
      });
      if(book){contexts.push(gsap.context(animateBook,$('main')));contexts.push(gsap.context(animatePageExits,$('main')));}
    }
    ScrollTrigger.refresh();
    if(preserve){intro?.progress(1);const current=previous&&ScrollTrigger.getById(previous.id);lenis?.scrollTo(current?current.start+(current.end-current.start)*progress:y,{immediate:true,force:true});ScrollTrigger.update();}
    window.__film={ready:true,reducedMotion:reduced.matches,metrics,layout:()=>({actual:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth}),prepare,
      settle:()=>{intro?.progress(1);ScrollTrigger.update();timelines.forEach(t=>{const tween=t.scrollTrigger?.getTween();if(tween&&typeof tween.progress==='function')tween.progress(1);});}};
  }
  function startLenis(){
    if(reduced.matches)return;
    lenis=new Lenis({lerp:.085,smoothWheel:true,syncTouch:false});window.__lenis=lenis;lenis.on('scroll',ScrollTrigger.update);
    ticker=time=>lenis.raf(time*1000);gsap.ticker.add(ticker);gsap.ticker.lagSmoothing(0);
  }
  await document.fonts.ready;startLenis();rebuild(false);initMedia();initGrain(reduced);
  function ensureAtmosphere(){if(!reduced.matches&&!atmosphere){mountAtmosphere();atmosphere=true;}}
  ensureAtmosphere();let timer;
  addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>rebuild(),220);},{passive:true});
  reduced.addEventListener('change',()=>{if(ticker)gsap.ticker.remove(ticker);lenis?.destroy();lenis=undefined;window.__lenis=undefined;startLenis();rebuild(false);ensureAtmosphere();});
  if(location.hash&&!location.hash.startsWith('#person=')){
    try{goTo(document.getElementById(decodeURIComponent(location.hash.slice(1))),{immediate:true});}catch{/* An invalid URL fragment has no matching anchor. */}
  }
  onReady();
  return {goTo};
}
