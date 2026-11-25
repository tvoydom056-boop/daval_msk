import {gsap,$} from './core.js';

export function initNavigation({getLenis}){
  const navigation=$('.navigation'),toggle=$('.nav-toggle'),dialog=$('#mobile-menu');
  const desktop=matchMedia('(min-width:768px)');
  let previousFocus,lastCheck=0;
  function release(){
    toggle.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('menu-open');
    getLenis()?.start();
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    previousFocus=null;
  }
  function close(){if(dialog.open)dialog.close();release();}
  toggle.addEventListener('click',()=>{
    previousFocus=toggle;
    dialog.dataset.theme=navigation.dataset.theme;
    dialog.showModal();
    toggle.setAttribute('aria-expanded','true');
    document.documentElement.classList.add('menu-open');
    getLenis()?.stop();
  });
  $('.menu-close',dialog).addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(previousFocus)release();});
  dialog.addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab')return;
    const items=[...dialog.querySelectorAll('button,a[href]')],first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  desktop.addEventListener('change',()=>{if(desktop.matches&&dialog.open)close();});
  function theme(time){
    if(document.hidden||dialog.open||time-lastCheck<.08)return;
    lastCheck=time;
    const capsule=desktop.matches?$('.nav-links'):toggle,rect=capsule.getBoundingClientRect();
    const layers=document.elementsFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
    let paper=false;
    for(const layer of layers){
      if(layer.closest('.navigation,.mobile-menu'))continue;
      const section=layer.closest('.book-page,.paper-section,.film-scene,.hero,.site-footer');
      if(!section)continue;
      const style=getComputedStyle(section);
      if(style.visibility==='hidden'||Number(style.opacity)<.55)continue;
      if(section.classList.contains('book-from-film')&&rect.top+rect.height/2<section.getBoundingClientRect().top+75)continue;
      const wash=section.querySelector('.chapter-paper');
      paper=section.id!=='prices'&&(section.matches('.book-page,.paper-section')||(wash&&Number(getComputedStyle(wash).opacity)>.55));
      break;
    }
    navigation.dataset.theme=paper?'paper':'dark';
  }
  navigation.dataset.theme='dark';
  gsap.ticker.add(theme);
}
