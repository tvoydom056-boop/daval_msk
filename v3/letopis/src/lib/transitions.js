import {$,gsap} from './core.js';

const pairs=[['petr','nikolay','blueprint'],['nikolay','sergey','stadium'],['sergey','maria','school']];
function openingClone(source){
  const clone=source.cloneNode(true);
  [clone,...clone.querySelectorAll('*')].forEach(element=>{
    element.removeAttribute('id');
    [...element.classList].forEach(name=>{element.classList.remove(name);element.classList.add('tr-'+name);});
  });
  return clone;
}
export function mountChapterTransitions(){
  pairs.forEach(([from,to,look])=>{
    const frame=document.createElement('div');
    frame.className='chapter-transition transition-'+look;frame.dataset.nextChapter=to;frame.setAttribute('aria-hidden','true');
    frame.append(openingClone($('#'+to+' .chapter-label')));
    if(look==='stadium')frame.append(openingClone($('#sergey .scoreboard')));
    $('#'+from+' .scene-stage').append(frame);
  });
}
export function animateChapterTransition(timeline){
  gsap.set('.chapter-transition',{opacity:0});
  timeline.to('.chapter-transition',{opacity:1,duration:4,ease:'none'},96);
}
