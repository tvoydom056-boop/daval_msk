import {gsap,ScrollTrigger,$,$$,pinTimeline,escapeHTML,addFrame} from '../lib/core.js';
import {content} from '../data.js';
import {benefitCards,priceHTML} from '../lib/benefits.js';

const e=escapeHTML;
const heading=data=>`<p class="eyebrow">${e(data.eyebrow)}</p><h2 data-paper-lines>${e(data.title)}</h2>`;
export function sectionMarkup(ids){
  const {restore,voice,qr,benefits,prices,how,faq,request}=content;
  const template=document.createElement('template');
  template.innerHTML=`<section id="restoration" class="restoration paper-section" data-pin-vh="120"><div class="restore-stage scene-stage"><div class="restore-heading">${heading(restore)}</div><div class="comparison" data-slot="Оригинал и восстановленная фотография"><img src="./media/nikolay-bw.jpg" width="1200" height="1500" alt="Оригинал 1958 года" loading="lazy"><div class="comparison-reveal"><img src="./media/nikolay-color.jpg" width="1200" height="1500" alt="После реставрации и раскрашивания" loading="lazy"></div><i class="comparison-line" aria-hidden="true"></i><input class="comparison-range" type="range" min="0" max="100" value="0" aria-label="Сравнить до и после"><span class="comparison-label original">${e(restore.tags[0])}</span><span class="comparison-label restored">${e(restore.tags[1])}</span></div></div><div class="restoration-notes paper-wrap">${restore.paragraphs.map(text=>`<p>${e(text)}</p>`).join('')}<ul>${restore.items.map(text=>`<li>${e(text)}</li>`).join('')}</ul></div></section>
  <section id="voice" class="paper-section"><div class="paper-wrap voice-layout"><div>${heading(voice)}<p class="paper-lead">${e(voice.lead)}</p></div><div class="voice-media"><div class="archive-audio" data-slot="Семейная запись голоса"><p>${e(voice.track)}</p><p class="eyebrow">${e(voice.credit)}</p><div class="audio-wave" aria-hidden="true">${Array.from({length:60},(_,i)=>`<i style="--height:${12+Math.abs(Math.sin(i*.7)*Math.sin(i*.23))*65}%"></i>`).join('')}</div><button class="text-button" data-demo-media>Слушать</button><p class="media-note">${e(voice.note)}</p></div><button class="archive-film" data-demo-media data-slot="Фильм-воспоминание"><img src="./media/family-1985.jpg" width="1600" height="1200" alt="Кадр из фильма-воспоминания" loading="lazy"><span>${e(voice.filmTitle)}<small>${e(voice.filmCredit)}</small></span></button></div></div></section>
  <section id="qr" class="paper-section"><div class="paper-wrap qr-layout"><figure class="qr-image" data-slot="Табличка с QR-кодом на памятнике"><img src="./media/grave-qr.jpg" width="1600" height="1200" alt="Табличка с QR-кодом на памятнике" loading="lazy"><i class="camera-viewfinder" aria-hidden="true"><b></b><b></b><b></b><b></b></i></figure><div>${heading(qr)}<p class="paper-lead">${e(qr.paragraph)}</p><dl class="burial-place">${qr.place.map(row=>`<div><dt>${e(row.label)}</dt><dd>${e(row.value)}</dd></div>`).join('')}</dl><a class="text-button" href="https://www.openstreetmap.org/?mlat=54.3712&mlon=48.5521#map=17/54.3712/48.5521" target="_blank" rel="noopener">Построить маршрут</a></div></div></section>
  <section id="benefits" class="paper-section" data-pin-vh="360"><div class="benefits-stage scene-stage"><header class="benefits-heading paper-wrap">${heading(benefits)}</header><div class="benefits-window"><div class="benefit-rail">${benefitCards()}</div></div><div class="benefits-progress" aria-hidden="true"><i></i></div></div></section>
  <section id="prices" class="paper-section"><div class="paper-wrap">${heading(prices)}<p class="paper-lead price-lead">${e(prices.lead)}</p><div class="price-plans">${prices.plans.map(plan=>`<div class="price-card-shell${plan.main?' price-card-shell-main':''}"><div class="price-card-entrance"><article class="price-plan${plan.main?' price-plan-main':''}">${plan.main?`<p class="plan-badge eyebrow">${e(plan.badge)}</p>`:''}<h3>${e(plan.title)}</h3><p class="plan-price">${priceHTML(plan.price)}</p><p class="plan-for">${e(plan.for)}</p><ul>${plan.items.map(text=>`<li>${e(text)}</li>`).join('')}</ul><a class="text-button" href="#request" data-plan="${e(plan.title)}">Выбрать</a><i class="price-pointer-glint" aria-hidden="true"></i></article></div></div>`).join('')}</div><p class="price-extra">${e(prices.extra)}</p></div></section>
  <section id="how" class="paper-section"><div class="paper-wrap">${heading(how)}<ol class="working-steps">${how.items.map(item=>`<li><span class="step-number">${e(item.number)}</span><div><h3>${e(item.title)}</h3><p>${e(item.text)}</p></div></li>`).join('')}</ol></div></section>
  <section id="faq" class="paper-section"><div class="paper-wrap faq-layout"><div>${heading(faq)}</div><div class="faq-list">${faq.items.map((item,index)=>`<details name="family-faq"${index===0?' open':''}><summary>${e(item.question)}<i aria-hidden="true"></i></summary><div><p>${e(item.answer)}</p></div></details>`).join('')}</div></div></section>
  <section id="request" class="paper-section"><div class="paper-wrap request-layout"><div>${heading(request)}<p class="paper-lead">${e(request.lead)}</p><p class="request-alternative">${e(request.alternative)}</p></div><form id="request-form" class="request-form">${request.fields.map(field=>`<label>${e(field.label)}${field.name==='plan'?`<select name="plan">${request.options.map(option=>`<option>${e(option)}</option>`).join('')}</select>`:field.name==='about'?`<textarea name="about" rows="3" maxlength="4000" placeholder="${e(field.placeholder)}"></textarea>`:`<input name="${e(field.name)}" required maxlength="${field.name==='name'?100:200}" placeholder="${e(field.placeholder)}" autocomplete="${field.name==='name'?'name':'tel'}">`}</label>`).join('')}<button class="text-button" type="submit">${e(request.submit)}</button><p class="demo-note">${e(request.demo)}</p><p class="form-note" role="status">${e(request.note)}</p></form></div></section>`;
  return ids.map(id=>template.content.querySelector('#'+id).outerHTML).join('');
}
export function mountSections(goTo) {
  const {restore,voice,qr,benefits,prices,how,faq,request}=content;
  $('#lower').innerHTML=sectionMarkup(['restoration','voice','qr','benefits','prices','how','faq','request']);
  $('.site-footer').innerHTML=content.footer.map(text=>`<span>${e(text)}</span>`).join('');
  const comparison=$('.comparison'),range=$('.comparison-range');
  range.addEventListener('input',()=>{comparison.dataset.manual='true';comparison.style.setProperty('--split',`${range.value}%`);});
  $('#request-form').addEventListener('submit',event=>{event.preventDefault();$('.form-note').textContent=request.demo;});
  $$('[data-demo-media]').forEach(button=>button.addEventListener('click',()=>{
    let note=button.parentElement.querySelector('.demo-media-status');
    if(!note){note=document.createElement('p');note.className='demo-media-status';note.setAttribute('role','status');button.parentElement.append(note);}
    note.textContent=button.classList.contains('archive-film')?'Это макет: фильм-воспоминание не подключён.':voice.note;
  }));
  $$('[data-plan]').forEach(link=>link.addEventListener('click',()=>{$('[name=plan]').value=link.dataset.plan;$('[name=plan]').dispatchEvent(new Event('change',{bubbles:true}));}));
  $$('.faq-list details').forEach(detail=>detail.addEventListener('toggle',()=>ScrollTrigger.refresh()));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  $$('.price-plan').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(reduced.matches||event.pointerType==='touch')return;
      const box=card.closest('.price-card-shell').getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));
      const y=Math.max(0,Math.min(1,(event.clientY-box.top)/box.height));
      card.style.setProperty('--shine-x',`${x*100}%`);card.style.setProperty('--shine-y',`${y*100}%`);card.style.setProperty('--shine-opacity','1');
      gsap.to(card,{rotationY:(x-.5)*12,rotationX:(.5-y)*12,duration:.35,overwrite:'auto',ease:'power2.out'});
    });
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--shine-opacity','0');gsap.to(card,{rotationY:0,rotationX:0,duration:.6,overwrite:'auto',ease:'power3.out'});});
  });
  addFrame($('#prices'),time=>$('.price-plan-main').style.setProperty('--border-angle',`${time*30%360}deg`),{fps:24});
  $$('.request-form input,.request-form select,.request-form textarea').forEach(control=>{
    const wrapper=document.createElement('span');wrapper.className='form-control';control.before(wrapper);wrapper.append(control);
    const line=document.createElement('i');line.className='field-line';line.setAttribute('aria-hidden','true');wrapper.append(line);
    const update=()=>wrapper.classList.toggle('has-value',Boolean(control.value.trim()));
    control.addEventListener('input',update);control.addEventListener('change',update);
  });
}
export function animateSections() {
  const root=$('#restoration'),comparison=$('.comparison'),range=$('.comparison-range');
  const timeline=pinTimeline('restoration',120,1);
  const state={value:0};
  timeline.to(state,{value:100,duration:100,onUpdate:()=>{
    if(!comparison.dataset.manual){comparison.style.setProperty('--split',`${state.value}%`);range.value=state.value;}
  }},0);
  gsap.fromTo('.qr-image img',{scale:1.12},{scale:1.02,ease:'none',scrollTrigger:{trigger:'.qr-layout',start:'top 85%',end:'bottom 35%',scrub:1}});
  gsap.fromTo('.camera-viewfinder',{xPercent:35,yPercent:-25,scale:2,opacity:0},{xPercent:0,yPercent:0,scale:1,opacity:1,ease:'none',scrollTrigger:{trigger:'.qr-layout',start:'top 80%',end:'center center',scrub:1}});
  gsap.fromTo('.price-card-entrance',{rotationX:18,y:80,opacity:0},{rotationX:0,y:0,opacity:1,stagger:.18,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:'.price-plans',start:'top 87%',toggleActions:'play none none none'}});
  $$('[data-paper-lines]').forEach(element=>gsap.fromTo($$('.line-mask > span',element),{yPercent:110},{yPercent:0,stagger:.09,duration:.9,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 90%',toggleActions:'play none none none'}}));
  return {timeline};
}
export function animateBenefits(){
  const timeline=pinTimeline('benefits',360,1);
  const rail=$('.benefit-rail'),viewport=$('.benefits-window');
  gsap.set(rail,{x:0});gsap.set('.benefits-progress i',{scaleX:0,transformOrigin:'left'});
  timeline.to(rail,{x:()=>-Math.max(0,rail.scrollWidth-viewport.clientWidth),duration:100},0)
    .to('.benefits-progress i',{scaleX:1,duration:100},0)
    .fromTo('.preview-book',{rotationY:-12,rotationX:12},{rotationY:8,rotationX:5,duration:100},0)
    .to('.preview-archive',{rotation:5,yPercent:-4,duration:100},0)
    .to('.preview-family',{scale:()=>innerWidth<768?.76:1.06,duration:100},0);
  return {timeline};
}
