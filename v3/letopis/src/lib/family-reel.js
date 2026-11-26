import {escapeHTML as e,media} from './core.js';

export function reelMarkup(items){
  const photos={page:['home/card-page.jpg','galina/galina-garden.jpg','galina/galina-granddaughter.jpg'],life:['war.jpg','warphoto.png'],family:['home/card-family.jpg','family-1985.jpg','nikolay-color.jpg'],maria:['school.jpg','people/maria.jpg'],sergey:['football.jpg','family-1985.jpg']};
  const rounds=Math.max(...items.map(item=>photos[item.id].length));
  const frames=Array.from({length:rounds},(_,round)=>items.filter(item=>photos[item.id][round]).map(item=>({item,image:photos[item.id][round]}))).flat();
  const group=copy=>`<div class="family-reel-group"${copy?' aria-hidden="true"':''}>${frames.map(({item,image})=>`<a href="${item.href}" class="family-reel-frame"${copy?' tabindex="-1"':''} aria-label="${e(item.person)}"><img src="${media(image)}" alt="${e(item.person)}" loading="lazy" decoding="async" draggable="false"><span>${e(item.person)}</span></a>`).join('')}</div>`;
  return `<div class="family-reel" aria-label="Фотографии семей. Ленту можно перетаскивать" data-lenis-prevent><div class="family-reel-track">${group(false)}${group(true)}</div></div>`;
}

export function initFamilyReel(){
  const root=document.querySelector('.family-reel'),track=root.querySelector('.family-reel-track');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let x=0,speed=14,length=1,visible=false,drag,blocked=false,last=0,raf=0;
  const measure=()=>{length=track.firstElementChild.getBoundingClientRect().width||1;paint();};
  const paint=()=>{x=(x%length+length)%length;track.style.transform=`translate3d(${-x}px,0,0)`;};
  const pause=()=>document.hidden||!visible||Boolean(root.querySelector(':focus-visible'));
  function tick(time){
    const dt=Math.min((time-last)/1000||0,.04);last=time;
    if(!reduced.matches&&!drag&&!pause()){
      x+=speed*dt;speed+=(14-speed)*(1-Math.exp(-3.5*dt));paint();
    }
    raf=requestAnimationFrame(tick);
  }
  const reset=()=>{drag=undefined;root.classList.remove('is-dragging');};
  root.addEventListener('pointerdown',event=>{
    if(reduced.matches||event.button!==0)return;
    blocked=false;speed=0;drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,time:event.timeStamp,started:false,touch:event.pointerType==='touch'};
  });
  root.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.started){
      if(Math.hypot(dx,dy)<6)return;
      if(drag.touch&&Math.abs(dy)>Math.abs(dx)){reset();return;}
      drag.started=true;root.setPointerCapture(event.pointerId);root.classList.add('is-dragging');
    }
    const elapsed=Math.max(8,event.timeStamp-drag.time),delta=event.clientX-drag.lastX;
    x-=delta;speed=Math.max(-1400,Math.min(1400,-delta*1000/elapsed));
    drag.lastX=event.clientX;drag.time=event.timeStamp;paint();
    event.preventDefault();
  });
  root.addEventListener('pointerup',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(event.timeStamp-drag.time>100)speed=0;
    const moved=drag.started;blocked=moved;reset();
    if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);
  });
  root.addEventListener('pointercancel',()=>{blocked=Boolean(drag?.started);speed=14;reset();});
  root.addEventListener('lostpointercapture',reset);
  root.addEventListener('click',event=>{if(blocked&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();blocked=false;}},true);
  root.addEventListener('dragstart',event=>event.preventDefault());
  root.addEventListener('focusin',event=>{
    if(reduced.matches||drag)return;
    const frame=event.target.closest('.family-reel-frame');if(!frame)return;
    x=frame.offsetLeft-16;root.scrollLeft=0;paint();
  });
  new ResizeObserver(measure).observe(root);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;}).observe(root);
  function motion(){cancelAnimationFrame(raf);last=0;reset();blocked=false;track.style.removeProperty('transform');root.scrollLeft=0;if(!reduced.matches){measure();raf=requestAnimationFrame(tick);}}
  reduced.addEventListener('change',motion);motion();
}
