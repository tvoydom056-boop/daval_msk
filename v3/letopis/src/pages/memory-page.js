import {galina} from '../content/page-galina.js';
import {home} from '../content/home.js';
import {gsap,escapeHTML as e} from '../lib/core.js';
import {siteURL,tariffBlock} from '../lib/shell.js';
import {mountPetals} from '../lib/petals.js';
import {candleMarkup,initCandle} from '../lib/candle.js';

const photoSizes=[[1600,1101],[1171,1600],[1280,1600],[1600,1067],[1600,1102],[1600,1067],[1600,1067],[1600,1067]];
const photoGroups=[[0,1],[2],[3,4],[5],[6,7]];
function albumPhoto(index){
  const [file,caption]=galina.photos[index],[width,height]=photoSizes[index];
  return `<figure class="memory-print" data-photo="${e(file)}" style="--print-turn:${index%2?1.6:-1.4}deg"><img src="${siteURL('media/galina/'+file)}" alt="${e(caption)}" width="${width}" height="${height}" loading="lazy" decoding="async" data-slot="${e(caption)}"><figcaption>${e(caption)}</figcaption></figure>`;
}

export function mountMemoryPage(){
  const name=galina.name.split(' ');
  document.querySelector('main').innerHTML=`<section class="memory-hero memory-section" id="galina" data-scene="galina" data-theme="paper"><div class="memory-hero-inner"><div class="memory-hero-copy"><p class="memory-kicker">${e(home.prices.tariffs[0].name)}</p><h1><span>${e(name.slice(0,2).join(' '))}</span> <span>${e(name.slice(2).join(' '))}</span></h1><p class="memory-years">${e(galina.years)}</p><p class="memory-place">${e(galina.place)}</p><blockquote class="memory-epigraph">${e(galina.epigraph)}</blockquote></div><figure class="memory-cover-print"><div class="memory-cover-image"><img src="${siteURL('media/home/card-page.jpg')}" alt="${e(galina.name)}" width="1600" height="2000" fetchpriority="high" data-slot="Обложка Галины Ветровой"></div><figcaption>${e(galina.name)} <span>${e(galina.years)}</span></figcaption></figure></div></section>${tariffBlock('page')}`;
  document.querySelector('#galina').insertAdjacentHTML('afterend',`<section class="memory-section memory-facts" id="facts" data-theme="paper" aria-label="Три факта"><dl>${galina.facts.map(([value,label])=>`<div><dt>${e(value)}</dt><dd>${e(label)}</dd></div>`).join('')}</dl></section>`);
  document.querySelector('#facts').insertAdjacentHTML('afterend',`<section class="memory-section memory-story" id="memory-story" data-theme="paper" aria-labelledby="memory-story-title"><header class="memory-story-heading"><p class="memory-kicker">${e(galina.years)}</p><h2 id="memory-story-title">История</h2></header>${galina.story.map((paragraph,index)=>`<p class="memory-paragraph" data-story-index="${index}">${e(paragraph)}</p><div class="memory-spread memory-spread-${index+1}${photoGroups[index].length===1?' memory-spread-single':''}">${photoGroups[index].map(albumPhoto).join('')}</div>`).join('')}</section>`);
  document.querySelector('#memory-story').insertAdjacentHTML('afterend',`<section class="memory-section memory-words" id="words" data-theme="paper" aria-labelledby="memory-words-title"><h2 id="memory-words-title">Слова родных</h2><div class="memory-notes">${galina.words.map(([author,text])=>`<figure class="memory-note"><blockquote>${e(text)}</blockquote><figcaption>${e(author)}</figcaption></figure>`).join('')}</div></section>`);
  document.querySelector('#words').insertAdjacentHTML('afterend',`<section class="memory-section memory-garden" id="garden" data-scene="garden" data-theme="paper" aria-label="Сад сегодня"><img src="${siteURL('media/galina/'+galina.photos[7][0])}" alt="${e(galina.photos[7][1])}" width="1600" height="1067" loading="lazy" decoding="async" data-slot="Вишнёвый сад сегодня"><p class="memory-garden-caption">Вишнёвый сад цветёт <br>до сих пор</p></section>`);
  document.querySelector('#garden').insertAdjacentHTML('afterend',candleMarkup({tone:'paper'}));
  initCandle({key:'letopis-page-galina-candle-v1'});
  mountPetals(document.querySelector('#galina'));
  mountPetals(document.querySelector('#garden'),{light:true});
  return {definitions:[['galina',()=>{const intro=gsap.fromTo('.memory-cover-image img',{filter:'brightness(1.8) saturate(.4)',opacity:.3},{filter:'brightness(1) saturate(1)',opacity:1,duration:1.7,ease:'power2.out'});return {intro};}],['memory-story',()=>{
    document.querySelectorAll('.memory-print').forEach(photo=>gsap.fromTo(photo,{opacity:0,y:30,rotation:parseFloat(photo.style.getPropertyValue('--print-turn'))*2.3},{opacity:1,y:0,rotation:parseFloat(photo.style.getPropertyValue('--print-turn')),duration:1.05,ease:'power2.out',scrollTrigger:{trigger:photo,start:'top 94%',once:true}}));return {};
  }],['garden',()=>{gsap.fromTo('.memory-garden>img',{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:'#garden',start:'top bottom',end:'bottom top',scrub:1}});return {};}]]};
}
