import heroHTML from '../templates/hero.html?raw';
import {home} from '../content/home.js';
import {gsap,ScrollTrigger,vh,escapeHTML as e,$,$$} from '../lib/core.js';
import {assetMarkup,exampleCards,siteURL} from '../lib/shell.js';
import {animateHero} from '../scenes/hero.js';
import {sectionMarkup} from '../scenes/sections.js';
import {animateHomeTone} from '../lib/home-tone.js';

export const heading=data=>`<p class="eyebrow">${e(data.kicker)}</p><h2>${e(data.title)}</h2>`;
export function mountHome(){
  document.querySelector('main').innerHTML=assetMarkup(heroHTML)+`<section class="home-about paper-section" id="about"><div class="home-about-stage home-section"><div class="home-wrap">${heading(home.about)}<div class="about-prose">${home.about.paragraphs.map(text=>`<p>${e(text)}</p>`).join('')}</div><dl class="about-facts">${home.about.facts.map(([title,text])=>`<div><dt>${e(title)}</dt><dd>${e(text)}</dd></div>`).join('')}</dl></div></div></section>`;
  $('#about').insertAdjacentHTML('afterend',`
    <section class="home-section home-dark home-examples" id="examples" data-theme="dark"><div class="home-wrap">${heading(home.examples)}<p class="section-note">${e(home.examples.note)}</p></div>${exampleCards()}</section>
    <section class="home-section paper-section home-how" id="how"><div class="home-wrap">${heading(home.how)}<ol class="home-steps">${home.how.steps.map(([title,text],index)=>`<li><span class="home-step-number">0${index+1}</span><div><h3>${e(title)}</h3><p>${e(text)}</p></div></li>`).join('')}</ol></div></section>
    <div id="home-services">${sectionMarkup(['restoration','qr','benefits'])}</div>
    <section class="home-section home-dark" id="prices" data-theme="dark"><div class="home-wrap">${heading(home.prices)}<div class="home-prices">${home.prices.tariffs.map(tariff=>`<article class="home-price${tariff.main?' home-price-main':''}"><h3>${e(tariff.name)}</h3><p class="home-price-value">${e(tariff.price)}</p><p class="home-price-time">${e(tariff.time)}</p><ul>${tariff.items.map(item=>`<li>${e(item)}</li>`).join('')}</ul><a class="home-button" href="${siteURL(tariff.example)}">Посмотреть пример</a></article>`).join('')}</div><a class="home-button primary prices-cta" href="#request">${e(home.prices.cta)}</a><div class="price-footnotes"><dl class="home-extras">${home.prices.extras.map(([label,price])=>`<div><dt>${e(label)}</dt><dd>${e(price)}</dd></div>`).join('')}</dl><div class="home-terms">${home.prices.terms.map(term=>`<p>${e(term)}</p>`).join('')}</div></div></div></section>
    <section class="home-section paper-section" id="families"><div class="home-wrap">${heading(home.families)}<p class="section-note">${e(home.families.note)}</p>${exampleCards({compact:true})}<a class="home-button families-link" href="${siteURL(home.families.link.href)}">${e(home.families.link.label)}</a></div></section>
    <section class="home-section home-dark" id="candle" data-theme="dark"><div class="home-wrap candle-layout"><div>${heading(home.candle)}<p class="section-note">${e(home.candle.text)}</p><button class="home-button primary" id="light-candle" type="button" aria-pressed="false">${e(home.candle.button)}</button><p class="candle-count" role="status"><span id="candle-count">0</span> ${e(home.candle.counter)}</p></div><div class="candle-image" data-slot="Свеча памяти"><img class="candle-base" src="${siteURL('media/home/candle-unlit.png')}" alt="Свеча памяти" width="1254" height="1254"><img class="candle-lit" src="${siteURL('media/home/candle.png')}" alt="" width="1254" height="1254" aria-hidden="true"><i class="candle-glow" aria-hidden="true"></i></div></div></section>
    ${sectionMarkup(['faq','request'])}`);
  // Keep the original useful demonstrations, remove cards repeating about/QR/examples.
  $$('.benefit-card-1,.benefit-card-2,.benefit-card-5').forEach(card=>card.remove());
  $$('#home-services [data-pin-vh]').forEach(section=>section.removeAttribute('data-pin-vh'));
  $('.benefits-progress').remove();
  const title=document.querySelector('.hero-word');
  title.innerHTML=[...home.hero.title].map(letter=>`<span class="letter-mask"><span>${e(letter)}</span></span>`).join('');
  document.querySelector('.hero-script').textContent=home.hero.script;
  document.querySelector('.hero-description').textContent=home.hero.lead;
  document.querySelector('.scroll-invitation').href='#about';
  document.querySelector('.hero').insertAdjacentHTML('beforeend',`<div class="hero-actions home-actions">${home.hero.actions.map((action,index)=>`<a class="home-button${index===0?' primary':''}" href="${e(action.href)}">${e(action.label)}</a>`).join('')}</div>`);
  document.querySelector('#site').insertAdjacentHTML('afterbegin','<div class="home-backdrop" aria-hidden="true"></div>');
  $$('#about,#examples,#how,#home-services>section,#prices,#families,#candle,#faq,#request,.site-footer').forEach(section=>{
    section.dataset.tone=section.classList.contains('home-dark')?'dark':'paper';
    section.dataset.theme=section.dataset.tone;
  });
  initHomeControls();
  return {onStatic:()=>animateHomeTone({reduced:true}),definitions:[['hero',animateHero],['about',()=>({timeline:gsap.timeline({scrollTrigger:{id:'about',trigger:'#about',start:'top top',end:()=>'+='+vh(115),pin:'.home-about-stage',scrub:true}}).to({},{duration:1})})],['how',()=>{
    $$('.home-steps li').forEach(step=>gsap.fromTo(step,{opacity:.25,y:28},{opacity:1,y:0,ease:'none',scrollTrigger:{trigger:step,start:'top 94%',end:'top 65%',scrub:true}}));
    return {};
  }],['main',animateHomeTone]]};
}

function initHomeControls(){
  const comparison=$('.comparison'),range=$('.comparison-range');
  range.value=50;comparison.style.setProperty('--split','50%');
  range.addEventListener('input',()=>comparison.style.setProperty('--split',range.value+'%'));
  $$('.faq-list details').forEach(detail=>detail.addEventListener('toggle',()=>ScrollTrigger.refresh()));
  const form=$('#request-form'),plan=$('[name=plan]');
  const id=new URLSearchParams(location.search).get('tariff');
  const selected=home.examples.items.findIndex(item=>item.id===id);
  if(selected>=0)plan.value=home.prices.tariffs[selected].name;
  $$('.request-form input,.request-form select,.request-form textarea').forEach(control=>{
    const wrapper=document.createElement('span');wrapper.className='form-control';control.before(wrapper);wrapper.append(control);
    wrapper.insertAdjacentHTML('beforeend','<i class="field-line" aria-hidden="true"></i>');
    const update=()=>wrapper.classList.toggle('has-value',Boolean(control.value.trim()));
    control.addEventListener('input',update);control.addEventListener('change',update);update();
  });
  form.addEventListener('submit',event=>{event.preventDefault();$('.form-note',form).textContent=$('.demo-note',form).textContent;});
  const key='letopis-home-candle-v1',button=$('#light-candle');
  let lit=false;
  try{lit=localStorage.getItem(key)==='1';}catch{/* Storage can be unavailable in a private browser. */}
  function show(){
    $('#candle').classList.toggle('is-lit',lit);$('#candle-count').textContent=lit?'1':'0';
    button.setAttribute('aria-pressed',String(lit));button.disabled=lit;
  }
  button.addEventListener('click',()=>{if(lit)return;lit=true;try{localStorage.setItem(key,'1');}catch{/* Keep one light for this visit. */}show();});
  addEventListener('storage',event=>{if(event.key===key&&event.newValue==='1'){lit=true;show();}});
  show();
}
