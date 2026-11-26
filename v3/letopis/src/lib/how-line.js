import {ScrollTrigger} from './core.js';

export function animateHowLine({reduced=false}={}){
  const list=document.querySelector('.home-steps'),steps=[...list.querySelectorAll(':scope > li')];
  let svg=list.querySelector(':scope > svg');
  if(!svg){list.insertAdjacentHTML('beforeend','<svg class="how-line" aria-hidden="true"><path class="how-line-guide"/><path class="how-line-ink"/></svg>');svg=list.lastElementChild;}
  const guide=svg.querySelector('.how-line-guide'),ink=svg.querySelector('.how-line-ink');
  let length=1,thresholds=[];
  function paint(progress){ink.style.strokeDashoffset=String(length*(1-progress));steps.forEach((step,i)=>step.classList.toggle('step-reached',progress>=(thresholds[i]||0)));}
  function measure(){
    const base=list.getBoundingClientRect(),mobile=innerWidth<768;
    const points=steps.map(step=>{const number=step.querySelector('.home-step-number').getBoundingClientRect();return mobile?[-10,number.top-base.top+number.height/2]:[number.left-base.left+number.width/2,-14];});
    const d=points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');
    guide.setAttribute('d',d);ink.setAttribute('d',d);
    length=ink.getTotalLength()||1;ink.style.strokeDasharray=String(length);
    let distance=0;thresholds=points.map((p,i)=>{if(i)distance+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);return distance/length;});
    paint(reduced?1:trigger?.progress||0);
  }
  let trigger;
  if(!reduced)trigger=ScrollTrigger.create({trigger:list,start:'top 78%',endTrigger:steps.at(-1),end:'top 43%',scrub:true,onUpdate:self=>paint(self.progress),onRefresh:measure});
  measure();return {};
}
