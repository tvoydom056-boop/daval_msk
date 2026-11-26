import {family} from '../content/family.js';
import {gsap,ScrollTrigger,addFrame,escapeHTML as e,media,$,$$} from '../lib/core.js';
import {bindFamilyBiography} from '../lib/family-biography.js';

export const archiveLayout={width:1280,height:744,cardWidth:226,cardHeight:138,positions:{
  petr:[86,22],maria:[328,22],ivan:[770,22],evdokia:[1012,22],
  nikolay:[448,168],anna:[690,168],sergey:[328,314],irina:[570,314],olga:[1012,314],
  dmitry:[328,460],anya:[690,460],misha:[328,606],
}};
const wideArchiveLayout={width:1368,height:768,cardWidth:244,cardHeight:164,portraitWidth:130,portraitHeight:162,positions:{
  petr:[52,26],maria:[312,26],ivan:[852,26],evdokia:[1112,26],
  nikolay:[452,198],anna:[712,198],sergey:[312,370],irina:[572,370],olga:[1112,370],
  dmitry:[312,542],anya:[832,542],misha:[572,600],
}};
export function familyRelations(id){
  const parents=Object.entries(family.children).find(([,children])=>children.includes(id))?.[0].split('+')||[];
  const spouse=family.couples.find(pair=>pair.includes(id))?.filter(person=>person!==id)||[];
  const children=Object.entries(family.children).filter(([key])=>key.split('+').includes(id)).flatMap(([,ids])=>ids);
  return {parents,spouse,children};
}
export function familyLineage(id){
  const people=new Set([id]),branches=new Set();
  function up(current){
    const relation=Object.entries(family.children).find(([,children])=>children.includes(current));
    if(!relation)return;
    const [key]=relation;branches.add(key+'>'+current);
    key.split('+').forEach(parent=>{if(!people.has(parent)){people.add(parent);up(parent);}});
  }
  function down(current){
    Object.entries(family.children).filter(([key])=>key.split('+').includes(current)).forEach(([key,children])=>{
      key.split('+').forEach(parent=>people.add(parent));
      children.forEach(child=>{branches.add(key+'>'+child);if(!people.has(child)){people.add(child);down(child);}});
    });
  }
  up(id);down(id);
  familyRelations(id).spouse.forEach(spouse=>people.add(spouse));
  return {people,branches};
}
function roundedPath(points,radius=4){
  let d=`M${points[0].join(' ')}`;
  for(let i=1;i<points.length-1;i++){
    const [x,y]=points[i],a=points[i-1],b=points[i+1];
    const r=Math.min(radius,Math.hypot(x-a[0],y-a[1])/2,Math.hypot(b[0]-x,b[1]-y)/2);
    const before=[x-Math.sign(x-a[0])*r,y-Math.sign(y-a[1])*r];
    const after=[x+Math.sign(b[0]-x)*r,y+Math.sign(b[1]-y)*r];
    d+=`L${before.join(' ')}Q${x} ${y} ${after.join(' ')}`;
  }
  return d+`L${points.at(-1).join(' ')}`;
}
export function archiveEdges(layout=archiveLayout){
  const {positions:p,cardWidth:w,cardHeight:h}=layout,edges=[];
  family.couples.forEach(pair=>{
    const [left,right]=pair.map(id=>p[id]);
    edges.push({key:pair.join('+'),kind:'couple',people:pair,d:roundedPath([[left[0]+w,left[1]+h/2],[right[0],right[1]+h/2]])});
  });
  Object.entries(family.children).forEach(([key,children])=>{
    const parents=key.split('+'),a=p[parents[0]],b=p[parents[1]];
    const x=b?(a[0]+w+b[0])/2:a[0]+w/2,y=a[1]+(b?h/2:h);
    children.forEach(child=>{
      const [left,top]=p[child];
      let points=[[x,y],[x,top-4],[left+w/2,top-4],[left+w/2,top]];
      if(!b&&top<a[1]+h&&left>=a[0]+w){
        const right=a[0]+w,from=a[1]+h/2,to=top+h/2,mid=(right+left)/2;
        points=[[right,from],[mid,from],[mid,to],[left,to]];
      }
      edges.push({key:key+'>'+child,kind:'child',people:[...parents,child],d:roundedPath(points)});
    });
  });
  return edges.sort((a,b)=>p[a.people[0]][1]-p[b.people[0]][1]);
}
export function mountFamilyTree(){
  const cards=family.generations.map((generation,index)=>`<div class="archive-generation" role="group" aria-label="${e(generation.n+' поколение, '+generation.years)}" data-archive-generation="${index}"><p class="archive-generation-label" style="top:${22+index*146+38}px"><b>${e(generation.n)}</b><span>${e(generation.years)}</span></p>${generation.ids.map(id=>{
    const person=family.people[id],[x,y]=archiveLayout.positions[id],[first,...last]=person.name.split(' ');
    return `<button type="button" class="archive-person" data-person="${id}" style="left:${x}px;top:${y}px" aria-haspopup="dialog" aria-controls="family-biography" aria-pressed="false" aria-label="${e(person.name+', '+person.years+', '+person.role)}"><img src="${media(person.photo)}" width="110" height="138" alt="" draggable="false" loading="eager" data-slot="Портрет ${e(person.name)}"><span class="archive-person-copy"><span class="archive-person-name"><span>${e(first)}</span> <span>${e(last.join(' '))}</span></span><span class="archive-person-years">${e(person.years)}</span><span class="archive-person-role">${e(person.role)}</span>${person.main?'<span class="archive-person-main">подробная глава</span>':''}</span></button>`;
  }).join('')}</div>`).join('');
  const paths=archiveEdges().map(edge=>`<path class="archive-edge" data-edge="${edge.key}" data-kind="${edge.kind}" data-people="${edge.people.join(' ')}" pathLength="1" d="${edge.d}"/>`).join('');
  const rail=family.generations.map((generation,index)=>`<p class="archive-rail-label" data-row="${index}"><b>${e(generation.n)}</b><span>${e(generation.years)}</span></p>`).join('');
  $('#nikolay').insertAdjacentHTML('beforebegin',`<section class="family-archive" id="tree" data-scene="tree" data-theme="dark" aria-labelledby="archive-title"><div class="archive-stage"><div class="archive-lamp" aria-hidden="true"></div><canvas class="archive-dust" aria-hidden="true"></canvas><header class="archive-heading"><h1 id="archive-title">${e(family.title)}</h1><p>${e(family.lead)}</p></header><div class="archive-mobile-ruler" aria-label="Поколения">${rail}</div><div class="archive-view" tabindex="0" aria-label="Семейное древо, пять поколений" data-lenis-prevent-touch><div class="archive-size"><div class="archive-world"><span class="archive-family-name" style="left:86px;width:468px">Соколовы</span><span class="archive-family-name" style="left:770px;width:468px">Орловы</span><svg class="archive-lines" viewBox="0 0 1280 744" aria-hidden="true">${paths}</svg>${cards}</div></div></div><p class="archive-help"><span>12 человек · 5 поколений</span><span class="archive-mobile-hint">Двигайте древо вбок</span><a href="#nikolay">Подробная глава Николая</a></p></div></section>`);
}

export function initFamilyTree(){
  const root=$('#tree'),view=$('.archive-view',root),size=$('.archive-size',root),world=$('.archive-world',root);
  const lines=$('.archive-lines',root),cards=$$('.archive-person',root),labels=$$('.archive-generation-label',root);
  const familyNames=$$('.archive-family-name',root);
  let currentLayout=archiveLayout;
  let reduced=false,lastMobile=innerWidth<768,selected=null,firstFit=true,biography;
  const listeners=new Set();
  function ruler(){
    const scale=Number(root.dataset.archiveScale)||.75;
    const rail=$('.archive-mobile-ruler',root);rail.style.top=view.offsetTop+'px';rail.style.height=view.clientHeight+'px';
    $$('.archive-rail-label',root).forEach(label=>label.style.top=(60+Number(label.dataset.row)*146)*scale-view.scrollTop+'px');
  }
  view.addEventListener('scroll',ruler,{passive:true});
  function applyLayout(layout){
    if(layout===currentLayout)return;
    currentLayout=layout;
    const {width,height,positions,cardWidth,cardHeight,portraitWidth=110,portraitHeight=138}=layout;
    const wide=layout===wideArchiveLayout;
    root.classList.toggle('archive-wide',wide);
    world.style.width=width+'px';world.style.height=height+'px';
    world.style.setProperty('--archive-card-width',cardWidth+'px');
    world.style.setProperty('--archive-card-height',cardHeight+'px');
    world.style.setProperty('--archive-portrait-width',portraitWidth+'px');
    world.style.setProperty('--archive-portrait-height',portraitHeight+'px');
    cards.forEach(card=>{
      const [x,y]=positions[card.dataset.person];
      card.style.left=x+'px';card.style.top=y+'px';
    });
    labels.forEach((label,index)=>{
      const [,y]=positions[family.generations[index].ids[0]];
      label.style.top=(y+(wide?cardHeight/2:38))+'px';
    });
    familyNames.forEach((name,index)=>{
      const [left,right]=family.couples[index].map(id=>positions[id][0]);
      name.style.left=left+'px';name.style.width=(right+cardWidth-left)+'px';
    });
    lines.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const byKey=new Map(archiveEdges(layout).map(edge=>[edge.key,edge.d]));
    $$('.archive-edge',lines).forEach(edge=>edge.setAttribute('d',byKey.get(edge.dataset.edge)));
  }
  function fit(){
    const mobile=innerWidth<768;
    const wide=!mobile&&!root.classList.contains('has-biography');
    const layout=wide?wideArchiveLayout:archiveLayout;
    applyLayout(layout);
    const scale=mobile ? .75 : Math.min(1,(view.clientWidth-16)/layout.width,view.clientHeight/layout.height);
    const height=layout.height*scale;
    world.style.transform=`scale(${scale})`;
    size.style.width=layout.width*scale+'px';size.style.height=height+'px';
    size.style.marginTop=wide?Math.max(0,(view.clientHeight-height)/2)+'px':'';
    root.dataset.archiveScale=scale.toFixed(4);
    if(mobile&&(firstFit||!lastMobile))view.scrollLeft=(561*scale)-view.clientWidth/2;
    if(!mobile)view.scrollLeft=0;
    firstFit=false;lastMobile=mobile;
    ruler();
    listeners.forEach(listener=>listener());
  }
  function highlight(id){
    selected=id;
    const line=id?familyLineage(id):null;
    root.classList.toggle('has-archive-selection',Boolean(id));
    $$('.archive-person',root).forEach(node=>{
      node.classList.toggle('is-current',node.dataset.person===id);
      node.classList.toggle('is-related',Boolean(line?.people.has(node.dataset.person)));
      node.classList.toggle('is-dim',Boolean(line&&!line.people.has(node.dataset.person)));
      node.setAttribute('aria-pressed',String(node.dataset.person===id));
    });
    $$('.archive-edge',root).forEach(edge=>{
      const related=line&&(edge.dataset.kind==='child'?line.branches.has(edge.dataset.edge):edge.dataset.people.split(' ').every(person=>line.people.has(person)));
      edge.classList.toggle('is-related',Boolean(related));edge.classList.toggle('is-dim',Boolean(line&&!related));
    });
  }
  const canvas=$('.archive-dust',root),ctx=canvas.getContext('2d');
  function dust(time=0){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#deb57e';
    for(let i=0;i<40;i++){
      ctx.globalAlpha=.08+.15*(.5+.5*Math.sin(time*.2+i));
      const x=((i*.618033+time*.0013)%1)*canvas.width,y=((i*.414214-time*.0007+1)%1)*canvas.height;
      ctx.beginPath();ctx.arc(x,y,.6+(i%4)*.3,0,Math.PI*2);ctx.fill();
    }
  }
  addFrame(root,dust,{fps:24});
  function resize(){canvas.width=$('.archive-stage',root).clientWidth;canvas.height=$('.archive-stage',root).clientHeight;fit();dust();}
  function animate(){
    if(root.dataset.revealed||reduced){gsap.set('.archive-generation,.archive-family-name',{opacity:1,y:0});gsap.set('.archive-edge',{strokeDashoffset:0});return {};}
    const timeline=gsap.timeline({scrollTrigger:{id:'archive-enter',trigger:root,start:'top 70%',once:true},onComplete:()=>{root.dataset.revealed='true';}});
    timeline.fromTo('.archive-family-name',{opacity:0},{opacity:1,duration:.4},0);
    family.generations.forEach((generation,index)=>timeline.fromTo(`[data-archive-generation="${index}"]`,{opacity:0,y:12},{opacity:1,y:0,duration:.5},index*.17));
    timeline.fromTo('.archive-edge',{strokeDasharray:1,strokeDashoffset:1},{strokeDashoffset:0,duration:.9,stagger:.04,ease:'power1.inOut'},.1);
    return {timeline};
  }
  resize();
  function revealCard(id,{force=false}={}){
    if(innerWidth>=768)return;
    const card=$(`[data-person="${id}"]`,root),box=card.getBoundingClientRect(),bounds=view.getBoundingClientRect();
    if(force||box.left<bounds.left+2||box.right>bounds.right){view.scrollLeft=(archiveLayout.positions[id][0]+archiveLayout.cardWidth/2)*.75-view.clientWidth/2;ruler();}
    if(box.top<bounds.top||box.bottom>bounds.bottom)view.scrollTop=(archiveLayout.positions[id][1]+archiveLayout.cardHeight/2)*.75-view.clientHeight/2;
  }
  const api={root,view,world,resize,fit,highlight,animate,revealCard,get selected(){return selected;},setReduced(value){reduced=value;biography?.setReduced(value);},onResize(listener){listeners.add(listener);},onReady(){}};
  biography=bindFamilyBiography(api,{relations:familyRelations});
  new ResizeObserver(fit).observe(view);
  api.onReady=()=>{fit();revealCard('nikolay',{force:true});biography.onReady();requestAnimationFrame(()=>{if(!window.__familyArchive.dialog.open)revealCard('nikolay',{force:true});});};
  return api;
}
