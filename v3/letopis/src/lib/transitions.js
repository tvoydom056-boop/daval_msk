import {$,gsap,ScrollTrigger,vh} from './core.js';

// A film closes on the same paper as its following page, never on the next film.
export function mountChapterTransitions(){
  ['petr','nikolay','sergey','maria'].forEach(id=>{
    const stage=$('#'+id+' .scene-stage');
    if(!stage)return;
    let paper=$('.paper-wash,.school-paper',stage);
    if(!paper){
      paper=document.createElement('div');
      paper.setAttribute('aria-hidden','true');
      stage.append(paper);
    }
    paper.classList.add('chapter-paper');
    stage.insertAdjacentHTML('beforeend','<div class="chapter-entry-fog" aria-hidden="true"><canvas class="procedural-fog"></canvas></div>');
  });
}

export function animateChapterTransition(timeline){
  const root=timeline.scrollTrigger.trigger;
  const paper=$('.chapter-paper',root);
  gsap.set(paper,{opacity:0});
  // Keep the closing image until the actual text page arrives in the viewport.
  const page=root.nextElementSibling;
  ScrollTrigger.create({trigger:page,start:'top bottom',end:'top top',scrub:true,
    onUpdate:self=>gsap.set(paper,{opacity:self.progress}),
    onRefresh:self=>gsap.set(paper,{opacity:self.progress})});

  // Keep every original story beat at the same scroll distance, after the handoff.
  const pinVh=Number(root.dataset.storyPinVh||root.dataset.pinVh),units=timeline.duration(),lead=units*75/pinVh;
  root.dataset.storyPinVh=pinVh;
  root.dataset.storyUnits=units;
  root.dataset.entryLeadVh=75;
  root.dataset.pinVh=pinVh+75;
  timeline.scrollTrigger.vars.end=()=>'+='+vh(pinVh+75);
  timeline.shiftChildren(lead,true,0);
  timeline.to({}, {duration:lead},0);
  const fog=$('.chapter-entry-fog',root);
  gsap.set(fog,{opacity:.8});
  timeline.to(fog,{opacity:0,duration:lead*.65,ease:'none'},lead*.25);
  // These are initially visible in the original film. Never mix them with book text.
  const opening=root.querySelectorAll('.chapter-label,.beat-year,.scoreboard');
  gsap.set(opening,{autoAlpha:0});
  timeline.to(opening,{autoAlpha:1,duration:.6,ease:'none'},lead);
}

export function animatePageExits(){
  document.querySelectorAll('.book-film-lead').forEach(page=>{
    const dissolve=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
      trigger:page,start:'bottom bottom',end:()=>'+='+vh(75),
      pin:true,pinSpacing:false,scrub:true,invalidateOnRefresh:true,
    }});
    dissolve.fromTo($('.book-layout',page),{opacity:1},{opacity:0,duration:.2},0)
      .fromTo(page,{filter:'brightness(1)',autoAlpha:1},{filter:'brightness(.72)',duration:.4},0)
      .to(page,{autoAlpha:0,duration:.75},0)
      .to({}, {duration:.25},.75);
  });
}
