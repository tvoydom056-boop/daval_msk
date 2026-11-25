import {gsap,ScrollTrigger,$,$$,escapeHTML} from '../lib/core.js';
import {storyText} from '../story-text.js';

const e=escapeHTML;
const ids=Object.keys(storyText.chapters);
const paragraph=text=>`<p data-book-reveal>${e(text)}</p>`;

function letterMarkup(id,data){
  return `<section class="book-page book-letter" id="${id}" aria-labelledby="${id}-title"><div class="book-layout">
    <header class="book-heading"><h2 id="${id}-title">${e(data.title)}</h2></header>
    <div class="book-prose">${data.paragraphs.map(paragraph).join('')}${data.by?`<p class="book-by" data-book-reveal>${e(data.by)}</p>`:''}</div>
  </div></section>`;
}

function chapterMarkup(id,data,index){
  const next=ids[index+1],nextData=storyText.chapters[next];
  const halfway=Math.ceil(data.paragraphs.length/2);
  const prose=data.paragraphs.map((text,i)=>paragraph(text)+(i+1===halfway?`<blockquote class="book-pull" data-book-reveal>${e(data.pull)}</blockquote>`:'')).join('');
  return `<article class="book-page book-chapter${next?' book-has-next':''}" id="${id}-story" data-book-chapter="${id}" aria-labelledby="${id}-story-title">
    <div class="book-layout">
      <header class="book-heading"><p class="book-kicker">${e(data.kicker)}</p><h2 id="${id}-story-title">${e(data.title)}</h2><p class="book-years">${e(data.years)}</p>${data.self?'<p class="book-self">Рассказывает сам</p>':''}</header>
      <aside class="book-notes" aria-label="Даты главы">${data.notes.map(([year,text])=>`<p class="book-note"><span>${e(year)}</span>${e(text)}</p>`).join('')}</aside>
      <div class="book-prose">${prose}</div>
      <footer class="book-next"${id==='petr'?' id="next"':''}>
        ${nextData?`<a class="book-next-link" href="#${next}"><span class="book-kicker">${e(nextData.kicker)}</span><span class="book-next-title">${e(nextData.title)}</span>${id==='petr'?'<span class="book-next-description">Мосты, которые стоят до сих пор</span>':''}</a>`:''}
        <button class="book-tree" type="button" data-go-tree>Вернуться к древу</button>
      </footer>
    </div>
    <div class="book-progress" aria-hidden="true"><div class="book-progress-stick"><i></i></div></div>
  </article>`;
}

export function mountBook(){
  $('#petr .epilogue')?.remove();
  $('#petr').insertAdjacentHTML('beforebegin',letterMarkup('story-intro',storyText.intro));
  ids.forEach((id,index)=>$('#'+id).insertAdjacentHTML('afterend',chapterMarkup(id,storyText.chapters[id],index)));
  $('#maria-story').insertAdjacentHTML('afterend',letterMarkup('story-outro',storyText.outro));
}

export function animateBook(){
  $$('[data-book-reveal]').forEach(element=>{
    if(element.dataset.bookSeen)return;
    gsap.fromTo(element,{opacity:0,y:16},{opacity:1,y:0,duration:.85,ease:'power2.out',scrollTrigger:{
      trigger:element,start:'top 93%',once:true,onEnter:()=>{element.dataset.bookSeen='true';}
    }});
  });
  $$('.book-chapter').forEach(chapter=>{
    const fill=$('.book-progress i',chapter);
    const update=trigger=>fill.style.transform=`scaleY(${trigger.progress})`;
    ScrollTrigger.create({trigger:chapter,start:'top 25%',end:'bottom 75%',onUpdate:update,onRefresh:update});
  });
  $$('.book-page').forEach(page=>ScrollTrigger.create({trigger:page,start:'top 70px',end:'bottom 70px',toggleClass:{targets:'.navigation',className:'nav-paper'}}));
}
