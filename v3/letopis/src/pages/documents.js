import '../documents.css';
import {docs} from '../content/docs.js';
import {escapeHTML as e} from '../lib/core.js';

// Escape each fragment before adding markup; brackets remain part of its text.
function fields(text){
  return String(text).split(/(\[[^\]]*\])/g).map(part=>part.startsWith('[')&&part.endsWith(']')?`<mark>${e(part)}</mark>`:e(part)).join('');
}

export function mountDocuments(){
  const main=document.querySelector('main');
  main.innerHTML=`<div class="documents-page" data-theme="paper">
    <div class="documents-wrap">
      <header class="documents-header">
        <h1>${e(docs.title)}</h1>
        <p class="documents-note">${fields(docs.note)}</p>
      </header>
      <div class="documents-layout">
        <nav class="documents-toc" aria-label="Разделы документов" data-lenis-prevent>
          ${docs.sections.map(section=>`<a href="#${e(section.id)}">${e(section.title)}</a>`).join('')}
        </nav>
        <div class="documents-content">
          ${docs.sections.map(section=>`<section class="documents-section" id="${e(section.id)}" aria-labelledby="${e(section.id)}-title" data-theme="paper">
            <h2 id="${e(section.id)}-title" tabindex="-1">${e(section.title)}</h2>
            ${section.blocks.map(([heading,text])=>`<div class="documents-block"><h3><strong>${fields(heading)}</strong></h3><p>${fields(text)}</p></div>`).join('')}
          </section>`).join('')}
          <p class="documents-edition">${fields(docs.edition)}</p>
        </div>
      </div>
    </div>
  </div>`;

  const page=main.querySelector('.documents-page');
  const toc=page.querySelector('.documents-toc');
  const sections=docs.sections.map(({id})=>document.getElementById(id));
  const links=[...toc.querySelectorAll('a')];
  const mobile=matchMedia('(max-width: 767px)');
  let ready=false,scheduled=false,historyFrame=0;

  function sectionFromHash(hash){
    try{return sections.find(section=>section.id===decodeURIComponent(hash.slice(1)));}
    catch{return undefined;}
  }
  function measure(){
    const navigation=document.querySelector('.navigation');
    const top=Math.ceil((navigation?.getBoundingClientRect().bottom||66)+18);
    const offset=top+(mobile.matches?toc.getBoundingClientRect().height+24:18);
    page.style.setProperty('--docs-sticky-top',`${top}px`);
    page.style.setProperty('--docs-anchor-offset',`${offset}px`);
    return offset;
  }
  function setCurrent(section){
    links.forEach(link=>{
      const current=link.hash===`#${section.id}`;
      if(current)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function scrollToSection(section,{focus=false}={}){
    const top=section?Math.max(0,scrollY+section.getBoundingClientRect().top-measure()):0;
    // Runtime uses Lenis and its default anchor handler replaces history.
    // This page owns legal anchors and supplies a measured numeric offset.
    if(window.__lenis)window.__lenis.scrollTo(top,{immediate:true,force:true});
    else window.scrollTo({top,behavior:'instant'});
    if(section){
      setCurrent(section);
      if(focus)section.querySelector('h2').focus({preventScroll:true});
    }
  }
  function restoreHash(){
    cancelAnimationFrame(historyFrame);
    historyFrame=requestAnimationFrame(()=>scrollToSection(sectionFromHash(location.hash)));
  }
  function handleAnchor(event){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');
    if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search)return;
    const section=sectionFromHash(url.hash);
    if(!section)return;
    event.preventDefault();
    // Capture stops the global runtime's document-level bubbling handler.
    event.stopPropagation();
    if(location.hash!==url.hash)history.pushState(null,'',`${url.pathname}${url.search}${url.hash}`);
    scrollToSection(section,{focus:true});
    if(toc.contains(link)&&mobile.matches){
      toc.scrollTo({left:Math.max(0,link.offsetLeft-toc.offsetLeft-16),behavior:'instant'});
    }
  }
  function updateCurrent(){
    scheduled=false;
    const offset=Number.parseFloat(getComputedStyle(page).getPropertyValue('--docs-anchor-offset'))||120;
    let current=sections[0];
    for(const section of sections){
      if(section.getBoundingClientRect().top<=offset+32)current=section;
      else break;
    }
    setCurrent(current);
  }
  function onScroll(){
    if(!scheduled){scheduled=true;requestAnimationFrame(updateCurrent);}
  }
  // Register before startRuntime attaches its generic click handler.
  document.addEventListener('click',handleAnchor,true);
  addEventListener('popstate',()=>{if(ready)restoreHash();});
  addEventListener('hashchange',()=>{if(ready)restoreHash();});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{measure();onScroll();},{passive:true});
  measure();
  setCurrent(sectionFromHash(location.hash)||sections[0]);

  return {
    onReady(){
      ready=true;
      if('scrollRestoration' in history)history.scrollRestoration='manual';
      measure();
      // Apply after runtime's initial unoffset deep-link jump.
      if(sectionFromHash(location.hash))restoreHash();
      else updateCurrent();
    }
  };
}
