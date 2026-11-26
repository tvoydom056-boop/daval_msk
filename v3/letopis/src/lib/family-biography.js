import {family} from '../content/family.js';
import {gsap,ScrollTrigger,escapeHTML as e,media,$,$$} from './core.js';

const propFiles={medal:'medal.png',letter:'letter.png',inkwell:'inkwell.png',globe:'globe.png',caliper:'caliper.png',helmet:'helmet.png',ball:'ball.png',pennant:'pennant.png',lantern:'props/lantern.png',thimble:'props/thimble.png',drafting:'props/drafting.png',librarycard:'props/librarycard.png',stethoscope:'props/stethoscope.png',plane:'props/plane.png',camera:'props/camera.png',gloves:'props/gloves.png'};

export function bindFamilyBiography(api,{relations}){
  const isPerson=id=>Object.hasOwn(family.people,id);
  const dialog=document.createElement('dialog');
  dialog.id='family-biography';dialog.className='family-biography';
  dialog.setAttribute('aria-labelledby','bio-name');dialog.setAttribute('aria-describedby','bio-role');
  dialog.innerHTML='<header class="bio-bar"><span class="bio-drag" aria-hidden="true">Семейная история</span><button type="button" class="bio-close">Закрыть</button></header><div class="bio-scroll" data-lenis-prevent tabindex="-1"><div class="bio-content"></div></div>';
  $('#site').append(dialog);
  const content=$('.bio-content',dialog),scroll=$('.bio-scroll',dialog),bar=$('.bio-bar',dialog);
  let selected=null,returnCard=null,previousHash='#tree',closing=false,reduced=false,modal=false,propsObserver;
  let panelTween,contentTween,photoTween,propTween,snapshot,snapshotTween;
  function anchorTree(){
    const y=api.root.getBoundingClientRect().top+scrollY;
    window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):window.scrollTo(0,y);
    ScrollTrigger.update();
  }
  function positionDialog(){
    const useModal=innerWidth<768;
    if(dialog.open&&modal!==useModal){
      const focus=document.activeElement;dialog.close();
      useModal?dialog.showModal():dialog.show();
      if(dialog.contains(focus))focus.focus({preventScroll:true});
    }
    modal=useModal;dialog.setAttribute('aria-modal',String(modal));
  }
  function markup(id){
    const person=family.people[id],kin=relations(id);
    const chips=(ids,label)=>ids.length?`<div class="bio-relation-group"><p>${label}</p><div>${ids.map(relative=>`<button type="button" class="bio-relative" data-relative="${relative}">${e(family.people[relative].name)}</button>`).join('')}</div></div>`:'';
    return `<header class="bio-portrait-heading"><figure class="bio-photo"><img src="${media(person.photo)}" width="200" height="250" alt="${e(person.name)}" data-slot="Биография ${e(person.name)}"></figure><div><p class="bio-kicker">${e(family.generations.find(generation=>generation.ids.includes(id)).n)} поколение</p><h2 id="bio-name" tabindex="-1">${e(person.name)}</h2><p class="bio-years">${e(person.years)}</p><p class="bio-role" id="bio-role">${e(person.role)}</p></div></header><div class="bio-prose">${person.bio.map(paragraph=>`<p>${e(paragraph)}</p>`).join('')}</div><blockquote class="bio-quote">${e(person.quote)}</blockquote><section class="bio-objects" aria-label="Предметы семейного архива">${person.props.map(([key,caption],index)=>`<figure class="bio-object${propFiles[key]?'':' bio-object-missing'}" data-prop="${key}" style="--prop-turn:${index%2?4:-5}deg">${propFiles[key]?`<img src="${media(propFiles[key])}" alt="" width="260" height="180" data-slot="${e(caption)}">`:''}<figcaption>${e(caption)}</figcaption></figure>`).join('')}</section>${person.link?`<a class="bio-story-link" href="${e(person.link.href)}">${e(person.link.label)}</a>`:''}<section class="bio-relatives" aria-labelledby="bio-relatives-title"><h3 id="bio-relatives-title">Родные</h3>${chips(kin.parents,'Родители')}${chips(kin.spouse,'Супруги')}${chips(kin.children,'Дети')}</section>`;
  }
  function animateObjects(){
    const objects=$$('.bio-object',content);
    propTween?.kill();propsObserver?.disconnect();
    if(reduced){gsap.set(objects,{opacity:1,y:0,rotation:0,scale:1});return;}
    gsap.set(objects,{opacity:0,y:42,rotation:-12,scale:.93});
    const reveal=()=>{
      if(reduced){gsap.set(objects,{opacity:1,y:0,rotation:0,scale:1});propsObserver?.disconnect();return;}
      propTween=gsap.to(objects,{opacity:1,y:0,rotation:index=>index%2?4:-5,scale:1,duration:.85,stagger:.13,ease:'back.out(1.1)'});
      propsObserver?.disconnect();
    };
    propsObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))reveal();},{root:scroll,threshold:.1});
    propsObserver.observe($('.bio-objects',content));
  }
  function render(id,{focus=true}={}){
    content.innerHTML=markup(id);dialog.dataset.person=id;scroll.scrollTop=0;
    $$('.bio-object img',content).forEach(img=>img.addEventListener('error',()=>{img.closest('figure').classList.add('bio-object-missing');img.remove();},{once:true}));
    photoTween?.kill();
    const photo=$('.bio-photo img',content);
    if(!reduced)photoTween=gsap.fromTo(photo,{opacity:.3,filter:'grayscale(1) contrast(.45) brightness(1.5) blur(2px)'},{opacity:1,filter:'grayscale(0) contrast(1) brightness(1) blur(0px)',duration:1,ease:'power2.out'});
    contentTween=gsap.fromTo(content,{opacity:reduced?1:0,y:reduced?0:8},{opacity:1,y:0,duration:reduced?0:.32,ease:'power2.out'});
    animateObjects();
    if(focus)$('#bio-name',dialog).focus({preventScroll:true});
  }
  function crossfade(id,{focus=true}={}){
    snapshotTween?.kill();snapshot?.remove();
    const old=content.cloneNode(true),style=getComputedStyle(scroll);
    old.classList.add('bio-previous');old.setAttribute('aria-hidden','true');old.inert=true;
    $$('[id]',old).forEach(node=>node.removeAttribute('id'));
    Object.assign(old.style,{position:'absolute',left:style.paddingLeft,top:(parseFloat(style.paddingTop)-scroll.scrollTop)+'px',width:content.getBoundingClientRect().width+'px',opacity:'1',transform:'none',pointerEvents:'none',zIndex:'0'});
    scroll.append(old);snapshot=old;
    render(id,{focus});
    snapshotTween=gsap.to(old,{opacity:0,duration:reduced?0:.12,ease:'power2.out',onComplete:()=>{old.remove();if(snapshot===old)snapshot=null;}});
  }
  function select(id,{push=true,trigger,focus=true}={}){
    if(!isPerson(id))return;
    const wasOpen=dialog.open,wasClosing=closing;
    if(!wasOpen){
      previousHash=location.hash.startsWith('#person=')?'#tree':location.hash||'#tree';
      returnCard=trigger||$(`[data-person="${id}"]`,api.root);
      anchorTree();
    }else if(trigger)returnCard=trigger;
    closing=false;selected=id;
    contentTween?.kill();api.root.classList.add('has-biography');api.highlight(id);
    if(push&&location.hash!=='#person='+id)history.pushState(null,'','#person='+id);
    if(!wasOpen){
      panelTween?.kill();
      render(id,{focus:false});positionDialog();
      modal?dialog.showModal():dialog.show();
      document.documentElement.classList.add('family-bio-open');window.__lenis?.stop();
      panelTween=gsap.fromTo(dialog,{opacity:reduced?1:0,x:0,y:0,xPercent:modal?0:100,yPercent:modal?100:0},{opacity:1,x:0,y:0,xPercent:0,yPercent:0,duration:reduced?0:.5,ease:'power3.out',onUpdate:api.fit,onComplete:()=>{$('#bio-name',dialog).focus({preventScroll:true});api.fit();}});
    }else{
      if(wasClosing){
        panelTween?.kill();
        panelTween=gsap.to(dialog,{opacity:1,x:0,y:0,xPercent:0,yPercent:0,duration:reduced?0:.35,ease:'power3.out',onUpdate:api.fit,onComplete:api.fit});
      }
      crossfade(id,{focus});
    }
  }
  function close({restoreHash=true,returnFocus=true,immediate=false}={}){
    if(!dialog.open||closing)return;
    closing=true;propsObserver?.disconnect();contentTween?.kill();photoTween?.kill();propTween?.kill();panelTween?.kill();snapshotTween?.kill();snapshot?.remove();snapshot=null;gsap.set(content,{opacity:1,y:0});
    api.root.classList.remove('has-biography');api.highlight(null);
    const target=returnCard;
    panelTween=gsap.to(dialog,{opacity:0,x:0,y:0,xPercent:modal?0:100,yPercent:modal?100:0,duration:immediate||reduced?0:.3,ease:'power2.in',onUpdate:api.fit,onComplete:()=>{
      selected=null;dialog.close();closing=false;document.documentElement.classList.remove('family-bio-open');window.__lenis?.start();
      if(restoreHash&&location.hash.startsWith('#person='))history.replaceState(null,'',previousHash);
      if(returnFocus&&target?.isConnected)requestAnimationFrame(()=>{if(!dialog.open){api.revealCard(target.dataset.person);target.focus({preventScroll:true});}});
      gsap.to({},{duration:reduced?0:.55,onUpdate:api.fit,onComplete:api.fit});
    }});
  }
  function goToChapter(id){
    const target=document.getElementById(id),trigger=ScrollTrigger.getById(id);if(!target)return;
    close({restoreHash:false,returnFocus:false,immediate:true});
    history.pushState(null,'','#'+id);
    const y=trigger?trigger.start+innerHeight*.75:target.getBoundingClientRect().top+scrollY;
    window.__lenis?window.__lenis.scrollTo(y,{force:true,duration:1.2}):target.scrollIntoView();
    target.tabIndex=-1;target.focus({preventScroll:true});
  }
  api.root.addEventListener('click',event=>{const card=event.target.closest('.archive-person');if(card)select(card.dataset.person,{trigger:card});});
  dialog.addEventListener('click',event=>{
    const relative=event.target.closest('[data-relative]');if(relative){select(relative.dataset.relative);return;}
    if(event.target.closest('.bio-close')){close();return;}
    const link=event.target.closest('.bio-story-link');if(link?.getAttribute('href').startsWith('#')){event.preventDefault();event.stopPropagation();goToChapter(link.hash.slice(1));}
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(!dialog.open&&selected&&!closing)close({immediate:true});});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
    if(event.key!=='Tab')return;
    const focusable=$$('button:not([disabled]),a[href]',dialog).filter(node=>!node.closest('[inert]')),first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  // A downward gesture closes only from the handle or from the top of the text.
  let touch=null;
  dialog.addEventListener('touchstart',event=>{
    if(!modal||event.touches.length!==1||event.target.closest('button,a'))return;
    touch={y:event.touches[0].clientY,x:event.touches[0].clientX,top:scroll.scrollTop,handle:bar.contains(event.target),delta:0};
  },{passive:true});
  dialog.addEventListener('touchmove',event=>{
    if(!touch||event.touches.length!==1)return;
    const delta=event.touches[0].clientY-touch.y,dx=Math.abs(event.touches[0].clientX-touch.x);
    if(delta>0&&delta>dx&&(touch.handle||touch.top<=0)){
      event.preventDefault();touch.delta=delta;gsap.set(dialog,{y:Math.min(delta,innerHeight*.65)});
    }
  },{passive:false});
  dialog.addEventListener('touchend',()=>{
    if(!touch)return;
    const distance=touch.delta;touch=null;
    if(distance>85)close();else gsap.to(dialog,{y:0,duration:.25,ease:'power2.out'});
  });
  dialog.addEventListener('touchcancel',()=>{touch=null;gsap.to(dialog,{y:0,duration:.2});});
  function syncHash(){
    const id=new URLSearchParams(location.hash.slice(1)).get('person');
    if(isPerson(id)){if(selected!==id||closing)select(id,{push:false});}
    else if(dialog.open)close({restoreHash:false,returnFocus:!location.hash||location.hash==='#tree',immediate:true});
  }
  addEventListener('popstate',syncHash);addEventListener('hashchange',syncHash);
  api.onResize(()=>{if(dialog.open)positionDialog();});
  window.__familyArchive={dialog,get selected(){return selected;},relations,props:propFiles};
  return {onReady:syncHash,setReduced(value){reduced=value;if(value&&dialog.open){photoTween?.progress(1);propTween?.progress(1);panelTween?.progress(1);contentTween?.progress(1);snapshotTween?.progress(1);propsObserver?.disconnect();gsap.set($$('.bio-object',content),{opacity:1,y:0,rotation:0,scale:1});}}};
}
