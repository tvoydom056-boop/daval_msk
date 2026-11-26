import petrHTML from '../templates/petr.html?raw';
import {assetMarkup,tariffBlock} from '../lib/shell.js';
import {gsap,ScrollTrigger,$,$$,media,vh} from '../lib/core.js';
import {words,odometer} from '../lib/text.js';
import {mountFamilyTree,initFamilyTree} from '../scenes/family-tree.js';
import {animatePetr} from '../scenes/petr.js';
import {mountNikolay,animateNikolay} from '../scenes/nikolay.js';
import {mountSergey,animateSergey,setStaticSergey} from '../scenes/sergey.js';
import {mountMaria,animateMaria} from '../scenes/maria.js';
import {mountBook} from '../scenes/book.js';
import {mountChapterTransitions} from '../lib/transitions.js';
import {candleMarkup,initCandle} from '../lib/candle.js';
import {mountLifeTitle} from '../lib/life-title.js';
import {mountLifeArchive} from './life-archive.js';
import {family} from '../content/family.js';
import {escapeHTML as e} from '../lib/core.js';

// The fixed plane also covers the incoming film until the archive dissolves.
function animateFamilyFlow(){
  const layer=$('.family-backdrop'),intro=$('#story-intro'),archive=$('#tree');
  const paint=progress=>{
    const rgb=[239,230,214].map((value,index)=>Math.round(value+([28,23,20][index]-value)*progress));
    layer.style.backgroundColor=`rgb(${rgb.join(',')})`;
    const linear=rgb.map(value=>{const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});
    const light=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
    intro.style.setProperty('--family-intro-ink',light>.65?'#302820':light>.179?'#010101':'#ffffff');
    intro.style.setProperty('--family-intro-accent',light>.72?'#8b542e':light>.179?'#010101':'#f3ece0');
    intro.dataset.theme=light>.179?'paper':'dark';
  };
  ScrollTrigger.create({trigger:archive,start:'top bottom',end:'top bottom-=80',scrub:true,onUpdate:self=>paint(self.progress),onRefresh:self=>paint(self.progress)});
  // The whole final view of the archive stays in place above a full-width film.
  // Reuse its existing 75vh entry lead; no extra pause is added to the film.
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:archive,start:'bottom bottom',end:()=>'+='+vh(75),pin:$('.archive-stage',archive),pinSpacing:false,scrub:true,invalidateOnRefresh:true}})
    .fromTo($('.archive-stage',archive),{opacity:1},{opacity:0,duration:.75},0)
    .fromTo(layer,{opacity:1},{opacity:0,duration:1},0);
  return {};
}

export function mountExample(id){
  const main=$('main');
  let tree;
  if(id==='life'){
    main.innerHTML=assetMarkup(petrHTML)+'<div id="lower"></div>';
    mountLifeTitle($('#petr'));
    $$('#petr .front-copy,#petr .medal-copy').forEach(el=>el.dataset.lines='');
    words($('#petr blockquote'));
    $('.medal-metal').style.setProperty('--medal-mask',`url("${new URL(media('medal.png'),document.baseURI).href}")`);
  }else{
    main.innerHTML='<div id="lower"></div>';
    if(id==='family'){
      mountNikolay();mountFamilyTree();
      tree=initFamilyTree({goTo:target=>{
        const trigger=ScrollTrigger.getById(target.id);
        if(window.__lenis&&trigger)window.__lenis.scrollTo(trigger.start+innerHeight*.75,{force:true,duration:1.5});
        else target.scrollIntoView();
      }});
      $('#site').insertAdjacentHTML('afterbegin',`<div class="family-backdrop" aria-hidden="true"><img class="family-album" src="${media('home/card-family.jpg')}" width="1600" height="2000" decoding="async" alt=""></div>`);
    }else if(id==='maria')mountMaria();
    else if(id==='sergey'){
      mountSergey();
      const person=family.people.sergey,root=$('#sergey');
      $('.scene-stage',root).insertAdjacentHTML('afterbegin',`<header class="life-title example-entry-title"><p class="entry-format">История жизни</p><h1 id="sergey-entry-name">${e(person.name)}</h1><p class="entry-years">${e(person.years)} · ${e(person.role)}</p><p class="entry-scroll">Листайте</p></header>`);
      root.setAttribute('aria-labelledby','sergey-entry-name');
    }
  }
  mountBook({intro:id==='family',outro:id==='family',introBefore:id==='family'?'tree':undefined});
  mountChapterTransitions();
  $('#lower').outerHTML=candleMarkup({tone:'paper'})+tariffBlock(id==='maria'||id==='sergey'?'life':id);
  if(id==='life')mountLifeArchive();
  initCandle({key:`letopis-example-${id}-candle-v1`});
  const definitions=id==='life'?[['petr',animatePetr]]:id==='family'?[['tree',()=>{const result=tree.animate();animateFamilyFlow();return result;}],['nikolay',animateNikolay]]:id==='maria'?[['maria',animateMaria]]:[['sergey',animateSergey]];
  return {book:true,tree,definitions,onReady:()=>tree?.onReady(),onStatic:()=>{
    if(id==='life'){odometer($('.year'))(1941);$('.count-number').textContent='37';}
    if(id==='family'){$('[data-object-count]').textContent='14';$('.family-backdrop').style.removeProperty('opacity');$('.family-backdrop').style.removeProperty('background-color');$('#story-intro').style.removeProperty('--family-intro-ink');$('#story-intro').style.removeProperty('--family-intro-accent');$('#story-intro').dataset.theme='paper';}
    if(id==='maria')$('[data-years-count]').textContent='41';
    if(id==='sergey')setStaticSergey();
  }};
}
