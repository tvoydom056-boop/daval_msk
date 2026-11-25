import {gsap,escapeHTML,$$} from './core.js';

export function words(element) {
  if(element.dataset.words)return;
  const text=element.textContent;
  element.setAttribute('aria-label',text);
  element.innerHTML=text.split(' ').map(word=>`<span class="quote-word" aria-hidden="true">${escapeHTML(word)}</span>`).join(' ');
  element.dataset.words='true';
}
export function letters(element,className='written-char') {
  if(element.dataset.letters)return;
  const text=element.textContent;
  element.setAttribute('aria-label',text);
  element.innerHTML=[...text].map(char=>char===' '?' ':`<span class="${className}" aria-hidden="true">${escapeHTML(char)}</span>`).join('');
  element.dataset.letters='true';
}
export function quoteReveal(timeline,selector,at,duration=3,stagger=.45) {
  gsap.set(`${selector} .quote-word`,{opacity:0,filter:'blur(6px)'});
  timeline.to(`${selector} .quote-word`,{opacity:1,filter:'blur(0px)',duration,stagger},at);
}
export function counter(timeline,element,from,to,at,duration) {
  const state={value:from};
  element.textContent=from;
  timeline.to(state,{value:to,duration,onUpdate:()=>{element.textContent=Math.round(state.value);}},at);
}
export function odometer(element) {
  const digits=$$('.digit-strip',element);
  digits.forEach(strip=>{if(!strip.children.length)strip.innerHTML=Array.from({length:10},(_,n)=>`<span>${n}</span>`).join('');});
  let previous;
  return value=>{
    const year=String(Math.round(value));
    if(year===previous)return;
    digits.forEach((strip,index)=>{strip.style.transform=`translate3d(0,${-Number(year[index])*1.15}em,0)`;});
    element.dataset.year=year;element.setAttribute('aria-label',year);previous=year;
  };
}
export function revealLines(timeline,selector,at,duration=3,stagger=1.5) {
  gsap.set(`${selector} .line-mask > span`,{yPercent:120});
  timeline.to(`${selector} .line-mask > span`,{yPercent:0,duration,stagger},at);
}
export function lineHTML(text) { return `<p class="line-mask"><span>${text}</span></p>`; }

// Measure real line breaks after local fonts load, retaining italic emphasis.
export function splitLines(element) {
  element.__lineSource ??= element.innerHTML;
  const source=document.createElement('div');source.innerHTML=element.__lineSource;
  const tokens=[];
  function walk(node,italic=false) {
    if(node.nodeType===3)node.textContent.split(/\s+/).filter(Boolean).forEach(text=>tokens.push({text,italic}));
    else [...node.childNodes].forEach(child=>walk(child,italic||node.nodeName==='EM'||node.classList?.contains('accent')));
  }
  walk(source);
  const computed=getComputedStyle(element);
  const contentWidth=element.clientWidth-(parseFloat(computed.paddingLeft)||0)-(parseFloat(computed.paddingRight)||0);
  element.innerHTML='';
  let lead=[];
  if(element.matches('[data-lines]')&&tokens.length){
    const measure=document.createElement('span');
    measure.style.cssText=`display:inline-block;white-space:nowrap;font-size:${computed.getPropertyValue('--caption-lead-size').trim()||(innerWidth<768?'24px':'32px')};font-style:italic`;
    element.append(measure);
    for(let index=1;index<=tokens.length;index++){
      measure.textContent=tokens.slice(0,index).map(token=>token.text).join(' ');
      if(index>1&&measure.getBoundingClientRect().width>contentWidth)break;
      lead=tokens.slice(0,index);
    }
    measure.remove();
    const paragraph=document.createElement('p');paragraph.className='line-mask caption-lead';
    paragraph.innerHTML=`<span>${lead.map(token=>escapeHTML(token.text)).join(' ')}</span>`;
    element.append(paragraph,document.createTextNode(' '));
  }
  const remaining=tokens.slice(lead.length);
  const spans=remaining.map(token=>{
    const span=document.createElement('span');span.textContent=token.text;span.style.display='inline-block';span.style.whiteSpace='nowrap';if(token.italic)span.style.fontStyle='italic';
    element.append(span,document.createTextNode(' '));return span;
  });
  const rows=[];
  spans.forEach((span,index)=>{const top=span.offsetTop;let row=rows.at(-1);if(!row||Math.abs(row.top-top)>3){row={top,words:[]};rows.push(row);}row.words.push(remaining[index]);});
  const tag=element.matches('h1,h2,h3')?'span':'p';
  const first=lead.length?`<p class="line-mask caption-lead"><span>${lead.map(token=>escapeHTML(token.text)).join(' ')}</span></p> `:'';
  element.innerHTML=first+rows.map(row=>`<${tag} class="line-mask"><span>${row.words.map(token=>token.italic?`<em>${escapeHTML(token.text)}</em>`:escapeHTML(token.text)).join(' ')}</span></${tag}>`).join(' ');
}
