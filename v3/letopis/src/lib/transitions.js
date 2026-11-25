import {$,gsap} from './core.js';

// A film closes on the same paper as its following page, never on the next film.
export function mountChapterTransitions(){
  ['petr','nikolay','sergey','maria'].forEach(id=>{
    const stage=$('#'+id+' .scene-stage');
    let paper=$('.paper-wash,.school-paper',stage);
    if(!paper){
      paper=document.createElement('div');
      paper.setAttribute('aria-hidden','true');
      stage.append(paper);
    }
    paper.classList.add('chapter-paper');
  });
}

export function animateChapterTransition(timeline){
  const root=timeline.scrollTrigger.trigger;
  const paper=$('.chapter-paper',root);
  gsap.set(paper,{opacity:0});
  timeline.to(paper,{opacity:1,duration:4,ease:'none'},96);
}
