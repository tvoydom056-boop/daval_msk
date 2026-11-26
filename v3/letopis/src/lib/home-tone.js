import {gsap,ScrollTrigger,$$} from './core.js';

const tones={paper:[239,230,214],dark:[28,23,20]};
let dispose=()=>{};

// One painted plane: sections never carry a second background through the frame.
export function animateHomeTone({reduced=false}={}){
  dispose();
  const layer=document.querySelector('.home-backdrop'),site=document.querySelector('#site');
  const sections=$$('[data-tone]');
  const color={r:239,g:230,b:214};
  let current,tween;
  const context=gsap.context(()=>{
    function paint(){
      const rgb=[color.r,color.g,color.b].map(Math.round);
      layer.style.backgroundColor=`rgb(${rgb.join(',')})`;
      const linear=rgb.map(value=>{const s=value/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});
      const light=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
      const paper=light>.179;
      // Near the crossover use almost black/white to keep small copy readable.
      const ink=paper?(light>.65?'#302820':'#000000'):(light<.06?'#f3ece0':'#ffffff');
      const accent=paper?(light>.72?'#8b542e':ink):(light<.058?'#d6aa79':ink);
      site.style.setProperty('--home-ink',ink);
      site.style.setProperty('--home-accent',accent);
      site.style.setProperty('--home-line',paper?'#49312040':'#ead7bd50');
      site.dataset.ink=paper?'paper':'dark';
    }
    function sync(immediate=false){
      const line=innerHeight*.6;
      const reached=sections.filter(section=>section.getBoundingClientRect().top<=line);
      const tone=reached.at(-1)?.dataset.tone||'paper';
      if(current===tone)return;
      const first=current===undefined;
      current=tone;layer.dataset.activeTone=tone;
      tween?.kill();
      const [r,g,b]=tones[tone];
      tween=gsap.to(color,{r,g,b,duration:reduced||first||immediate?0:.9,ease:'power1.inOut',onUpdate:paint});
    }
    sections.forEach(section=>ScrollTrigger.create({trigger:section,start:'top 60%',end:'bottom 60%',onToggle:()=>sync(),onRefresh:()=>sync()}));
    ScrollTrigger.create({start:0,end:'max',onUpdate:()=>sync(),onRefresh:()=>sync()});
    paint();sync(true);
    return()=>tween?.kill();
  });
  dispose=()=>context.revert();
  return {};
}
