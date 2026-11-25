import {family,people} from '../data.js';
import {gsap,pinTimeline,addFrame,clamp,escapeHTML as e} from '../lib/core.js';
import {TREE,treeRows,treePositions,treeEdges,lineage} from '../lib/tree-layout.js';

export function mountTree(){
  const cards=treeRows.map((row,index)=>'<div class="tree-generation" data-generation="'+index+'"><div class="tree-generation-label" style="top:'+treePositions[row[0][0]].y+'px"><b>'+family.generations[index].label+'</b><span>'+family.generations[index].years+'</span></div>'+row.map(([id])=>{
    const p=people[id],pos=treePositions[id],[given,...surname]=p.name.split(' ');
    return '<button type="button" class="tree-person" data-person="'+id+'" aria-pressed="false" aria-label="'+e(p.name+', '+p.years+', '+p.role)+'" style="left:'+pos.x+'px;top:'+pos.y+'px"><span class="tree-person-photo"><img src="./media/people/'+id+'.jpg" width="84" height="104" loading="lazy" draggable="false" alt="'+e(p.name)+'"></span><span class="tree-person-name"><span>'+e(given)+'</span><span>'+e(surname.join(' '))+'</span></span><span class="tree-person-years">'+e(p.years)+'</span></button>';
  }).join('')+'</div>').join('');
  const paths=treeEdges().map(edge=>{
    const attributes=' data-kind="'+edge.type+'" data-generation="'+edge.generation+'" data-parents="'+edge.parents.join(' ')+'" data-children="'+edge.children.join(' ')+'" pathLength="1000" d="'+edge.d+'"/>';
    return '<path class="tree-edge-guide"'+attributes+'<path class="tree-edge"'+attributes;
  }).join('');
  const html='<section class="film-scene family-tree-scene" id="tree" data-scene="tree" data-pin-vh="200" aria-labelledby="tree-title"><div class="scene-stage tree-screen"><canvas class="tree-dust" aria-hidden="true"></canvas><header class="tree-heading"><h2 id="tree-title">Из корней вырастаем мы.</h2><p>Пять поколений одной семьи</p></header><div class="tree-window" data-lenis-prevent><div class="tree-world"><div class="tree-family-name" style="left:400px">Соколовы</div><div class="tree-family-name" style="left:940px">Орловы</div><svg class="tree-links" viewBox="0 0 '+TREE.width+' '+TREE.height+'" aria-hidden="true">'+paths+'</svg>'+cards+'</div></div><aside class="selection tree-selection" hidden aria-live="polite"></aside><div class="tree-help"><span class="tree-desktop-hint">Выберите человека, чтобы увидеть его линию</span><span class="tree-mobile-hint">Двигайте древо пальцем</span><a href="#petr">К историям</a></div></div></section>';
  document.getElementById('petr').insertAdjacentHTML('beforebegin',html);
}

export function initTree({goTo}){
  const root=document.getElementById('tree'),viewport=root.querySelector('.tree-window'),world=root.querySelector('.tree-world'),panel=root.querySelector('.selection');
  const nodes=[...root.querySelectorAll('[data-person]')],edges=[...root.querySelectorAll('.tree-edge,.tree-edge-guide')];
  let reduced=false,selected=null,hovered=null,suppressClick=0,gesture=null;
  const camera={zoom:2.2,x:400,y:78,overview:0};
  const view={scale:1,x:0,y:0};
  const pan={active:false,scale:.75,x:0,y:0,vx:0,vy:0};
  const pointers=new Map();
  const mobile=()=>innerWidth<768;
  const size=()=>({width:viewport.clientWidth||innerWidth,height:viewport.clientHeight||innerHeight*.74});
  function constrain(){
    const {width,height}=size(),w=TREE.width*pan.scale,h=TREE.height*pan.scale;
    pan.x=w>width?clamp(pan.x,width-w-32,32):(width-w)/2;
    pan.y=h>height?clamp(pan.y,height-h-24,24):(height-h)/2;
  }
  function applyCamera(){
    if(reduced&&!mobile()){world.style.transform='none';return;}
    const {width,height}=size();
    let scale,x,y;
    if(mobile()){
      if(!pan.active){
        const blend=reduced?1:camera.overview;
        pan.scale=(.75+(camera.zoom-1)*.18)*(1-blend)+.75*blend;
        pan.x=width/2-(camera.x*(1-blend)+700*blend)*pan.scale;
        pan.y=(height*.28-camera.y*pan.scale)*(1-blend)+(height/2-326*.75)*blend;
      }
      constrain();scale=pan.scale;x=pan.x;y=pan.y;
    }else{
      const fit=Math.min(1,height/TREE.height,(width-24)/TREE.width),blend=camera.overview;
      scale=camera.zoom*(1-blend)+fit*blend;
      const center=camera.x*(1-blend)+TREE.width/2*blend;
      x=width/2-center*scale;
      y=(height*.28-camera.y*scale)*(1-blend)+(height-TREE.height*fit)/2*blend;
    }
    Object.assign(view,{scale,x,y});
    world.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
    root.dataset.treeScale=scale.toFixed(4);
  }
  function highlight(){
    const active=hovered||selected,kin=active?lineage(active):null;
    root.classList.toggle('has-lineage',Boolean(active));
    nodes.forEach(node=>{
      const on=kin?.has(node.dataset.person);
      node.classList.toggle('is-related',Boolean(on));node.classList.toggle('is-dim',Boolean(kin&&!on));
      node.classList.toggle('is-current',node.dataset.person===active);
      node.setAttribute('aria-pressed',String(node.dataset.person===selected));
    });
    edges.forEach(edge=>{
      const parents=edge.dataset.parents.split(' '),children=edge.dataset.children.split(' ').filter(Boolean);
      const on=kin&&(edge.dataset.kind==='couple'?parents.every(id=>kin.has(id)):parents.some(id=>kin.has(id))&&children.some(id=>kin.has(id)));
      edge.classList.toggle('is-related',Boolean(on));edge.classList.toggle('is-dim',Boolean(kin&&!on));
    });
  }
  function close(){selected=null;panel.hidden=true;panel.classList.remove('is-open');root.classList.remove('is-selected');highlight();applyCamera();}
  function select(id){
    selected=id;const person=people[id],chapter=['petr','nikolay','sergey','maria'].includes(id);
    panel.innerHTML='<div><h3>'+e(person.name)+'</h3><p class="selection__years">'+e(person.years)+'</p></div><p class="selection__bio">'+e(person.bio)+'</p><div>'+(chapter?'<a class="glass-btn" href="#'+id+'">Читать историю</a>':'')+'<button type="button" class="selection__close" aria-label="Закрыть сведения о человеке">Закрыть</button></div>';
    panel.hidden=false;panel.classList.add('is-open');root.classList.add('is-selected');
    panel.querySelector('.selection__close').addEventListener('click',close);
    panel.querySelector('.glass-btn')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();goTo(document.getElementById(id));});
    highlight();applyCamera();
  }
  world.addEventListener('pointerover',event=>{if(event.pointerType==='touch')return;const id=event.target.closest('[data-person]')?.dataset.person;if(hovered!==id){hovered=id||null;highlight();}});
  world.addEventListener('pointerleave',()=>{hovered=null;highlight();});
  world.addEventListener('focusin',event=>{hovered=event.target.closest('[data-person]')?.dataset.person||null;highlight();});
  world.addEventListener('focusout',()=>{hovered=null;highlight();});
  world.addEventListener('click',event=>{if(performance.now()<suppressClick)return;const person=event.target.closest('[data-person]');if(person)select(person.dataset.person);else close();});
  root.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  function local(event){const rect=viewport.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top};}
  function beginGesture(){
    const pts=[...pointers.values()];
    if(pts.length>=2){const [a,b]=pts;const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};gesture={pinch:true,distance:Math.hypot(a.x-b.x,a.y-b.y),scale:pan.scale,wx:(center.x-pan.x)/pan.scale,wy:(center.y-pan.y)/pan.scale};suppressClick=performance.now()+400;}
    else if(pts.length){gesture={pinch:false,start:{...pts[0]},last:{...pts[0]},time:performance.now(),moved:false};}
    else gesture=null;
  }
  viewport.addEventListener('pointerdown',event=>{
    if(!mobile()||event.button>0)return;
    if(!pan.active){Object.assign(pan,{active:true,...view,vx:0,vy:0});}
    pan.vx=pan.vy=0;pointers.set(event.pointerId,local(event));beginGesture();
    try{viewport.setPointerCapture(event.pointerId);}catch{/* Synthetic events have no active pointer. */}
  });
  viewport.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||!gesture)return;
    const point=local(event);pointers.set(event.pointerId,point);const pts=[...pointers.values()];
    if(gesture.pinch&&pts.length>=2){
      const [a,b]=pts,center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      pan.scale=clamp(gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance),.6,1.4);
      pan.x=center.x-gesture.wx*pan.scale;pan.y=center.y-gesture.wy*pan.scale;suppressClick=performance.now()+400;
    }else{
      const now=performance.now(),dx=point.x-gesture.last.x,dy=point.y-gesture.last.y,elapsed=Math.max(8,now-gesture.time);
      if(Math.hypot(point.x-gesture.start.x,point.y-gesture.start.y)>5)gesture.moved=true;
      pan.x+=dx;pan.y+=dy;pan.vx=clamp(dx/elapsed*16.67,-36,36);pan.vy=clamp(dy/elapsed*16.67,-36,36);gesture.last=point;gesture.time=now;
      if(gesture.moved)suppressClick=now+350;
    }
    constrain();applyCamera();event.preventDefault();
  });
  function endPointer(event){
    if(!pointers.has(event.pointerId))return;
    if(gesture?.pinch||gesture?.moved)suppressClick=performance.now()+350;
    if(event.type==='pointercancel'){pan.vx=pan.vy=0;}
    pointers.delete(event.pointerId);beginGesture();
    try{if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);}catch{}
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>viewport.addEventListener(type,endPointer));
  viewport.addEventListener('wheel',event=>{
    if(!mobile()||!event.ctrlKey)return;event.preventDefault();
    if(!pan.active)Object.assign(pan,{active:true,...view,vx:0,vy:0});
    const point=local(event),wx=(point.x-pan.x)/pan.scale,wy=(point.y-pan.y)/pan.scale;
    pan.scale=clamp(pan.scale*Math.exp(-event.deltaY*.003),.6,1.4);pan.x=point.x-wx*pan.scale;pan.y=point.y-wy*pan.scale;constrain();applyCamera();
  },{passive:false});
  const canvas=root.querySelector('.tree-dust'),ctx=canvas.getContext('2d');
  const dust=Array.from({length:34},(_,index)=>({x:Math.random(),y:Math.random(),size:.5+Math.random()*1.2,phase:index*1.7}));
  function resize(){canvas.width=innerWidth;canvas.height=innerHeight;pan.vx=pan.vy=0;applyCamera();}
  addFrame(root,(seconds,delta)=>{
    if(mobile()&&pan.active&&!pointers.size&&(Math.abs(pan.vx)>.04||Math.abs(pan.vy)>.04)){
      const frames=delta*60;pan.x+=pan.vx*frames;pan.y+=pan.vy*frames;pan.vx*=Math.pow(.91,frames);pan.vy*=Math.pow(.91,frames);constrain();applyCamera();
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#d9ac70';
    dust.forEach(dot=>{ctx.globalAlpha=.09+.12*(.5+.5*Math.sin(seconds*.23+dot.phase));ctx.beginPath();ctx.ellipse(((dot.x+seconds*.0015)%1)*canvas.width,((dot.y-seconds*.0008+1)%1)*canvas.height,dot.size,dot.size,0,0,Math.PI*2);ctx.fill();});
  },{fps:30});
  resize();
  return {
    resize,
    setReduced(value){reduced=value;pan.active=false;pan.vx=pan.vy=0;if(value){root.inert=false;root.querySelectorAll('.tree-generation').forEach(el=>el.style.opacity='1');edges.forEach(el=>{el.style.strokeDashoffset='0';});}applyCamera();},
    animate(){
      const timeline=pinTimeline('tree',315,1);
      Object.assign(camera,{zoom:2.2,x:400,y:78,overview:0});pan.active=false;
      gsap.set('.tree-generation',{opacity:mobile()?.45:0});
      // The first generation is explicit because other world decorations precede it.
      gsap.set(root.querySelector('.tree-generation[data-generation="0"]'),{opacity:1});
      if(mobile())gsap.set(root.querySelector('.tree-generation[data-generation="1"]'),{opacity:1});
      gsap.set('.tree-edge',{strokeDasharray:1000,strokeDashoffset:1000});
      gsap.set('.tree-edge[data-generation="0"]',{strokeDashoffset:0});
      timeline.to(camera,{zoom:1.6,x:700,y:238,duration:18,onUpdate:applyCamera},0)
        .to(camera,{zoom:1.2,x:675,y:398,duration:16,onUpdate:applyCamera},18)
        .to(camera,{zoom:1,x:550,y:558,duration:16,onUpdate:applyCamera},34)
        .to(camera,{zoom:.95,x:625,y:718,duration:12,onUpdate:applyCamera},50)
        .to(camera,{overview:1,duration:8,onUpdate:applyCamera},62);
      for(let index=1;index<5;index++){
        const start=6+(index-1)*14;
        timeline.to('.tree-edge[data-generation="'+index+'"]',{strokeDashoffset:0,duration:12},start)
          .to('.tree-generation[data-generation="'+index+'"]',{opacity:1,duration:4},start+8);
      }
      timeline.to({}, {duration:30},70).addLabel('end',100);
      // The real tree is already pinned behind the hero. Start its camera as fog opens.
      const lead=mobile()?100*110/205:31.25;
      timeline.shiftChildren(lead,true,0);
      timeline.to({}, {duration:lead},0);
      applyCamera();return {timeline};
    },
  };
}
