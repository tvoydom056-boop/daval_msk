import {content,chapters,people} from '../data.js';
import {escapeHTML as e} from './core.js';

const portrait=(id,className='')=>`<img class="${className}" src="./media/people/${id}.jpg" alt="${e(people[id].name)}" loading="lazy" width="600" height="750">`;
export function benefitCards(){
  const tree=content.prices.plans.find(plan=>plan.title==='Семейное древо');
  const items=[...content.benefits.items,{title:tree.title,text:tree.items[1]}];
  const quote=chapters.find(chapter=>chapter.id==='nikolay').quote;
  const visuals=[
    `<div class="preview-page"><div class="preview-browser"><span>Летопись</span><i></i></div><div class="preview-page-scene"><img src="./media/hero.jpg" alt="Первый экран страницы памяти" loading="lazy"><p>Летопись<em>рода</em></p></div></div>`,
    `<div class="preview-qr"><img src="./media/grave-qr.jpg" alt="Крупный план QR-таблички на памятнике" loading="lazy"></div>`,
    `<div class="preview-book"><div class="book-page book-page-left"><p>Николай Петрович</p><img src="./media/nikolay-bw.jpg" alt="Портрет Николая в PDF-книге" loading="lazy"><small>1931-2019</small></div><div class="book-page book-page-right"><span>II</span><p>${e(quote)}</p><i></i><i></i><i></i></div></div>`,
    `<div class="preview-archive">${['family-1985.jpg','people/petr.jpg','nikolay-color.jpg','people/maria.jpg'].map((name,index)=>`<figure style="--card:${index}"><img src="./media/${name}" alt="Фотография из семейного архива" loading="lazy"></figure>`).join('')}</div>`,
    `<div class="preview-family"><svg viewBox="0 0 240 270" fill="none" aria-hidden="true"><path d="M84 49H156M120 49V103H60V111M84 139H156M120 139V193H60V201M84 229H156"/></svg>${['petr','maria','nikolay','anna','sergey','irina'].map(id=>`<span>${portrait(id)}</span>`).join('')}</div>`,
  ];
  return items.map((item,index)=>`<article class="benefit-card benefit-card-${index+1}"><div class="benefit-visual">${visuals[index]}<span class="benefit-index" aria-hidden="true">0${index+1}</span></div><div class="benefit-card-copy"><h3>${e(item.title)}</h3><p>${e(item.text)}</p></div></article>`).join('');
}
export function priceHTML(price){
  const from=price.startsWith('от '),number=price.replace(/^от /,'').replace(/ ₽$/,'');
  return `${from?'<span class="price-prefix">от </span>':''}<span class="price-value">${e(number)}</span><span class="price-currency"> ₽</span>`;
}
