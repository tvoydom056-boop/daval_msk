import {home} from '../content/home.js';
import {escapeHTML as e} from '../lib/core.js';
import {siteURL,exampleCards,tariffBlock} from '../lib/shell.js';

export function mountPlaceholder(page){
  const main=document.querySelector('main');
  if(page==='example-page'){
    const item=home.examples.items[0];
    main.innerHTML=`<section class="memory-cover" data-theme="dark"><img src="${siteURL(item.image)}" alt="${e(item.person)}" width="1600" height="2000" data-slot="Обложка страницы памяти"><div class="home-wrap"><p class="eyebrow">Пример · ${e(item.tariff)}</p><h1>${e(item.person)}</h1><p class="memory-years">${e(item.years)}</p><p>Пример готовится</p></div></section>${tariffBlock('page')}`;
  }else if(page==='families'){
    main.innerHTML=`<section class="home-section paper-section listing-page"><div class="home-wrap"><p class="eyebrow">${e(home.families.kicker)}</p><h1>${e(home.families.kicker)}</h1><p class="section-note">${e(home.families.note)}</p>${exampleCards({compact:true})}</div></section>`;
  }else{
    main.innerHTML=`<section class="home-section paper-section documents-page"><div class="home-wrap"><p class="eyebrow">Летопись</p><h1>Документы</h1><nav class="document-links" aria-label="Разделы документов">${home.footer.docs.map(([label,href])=>`<a href="#${href.split('#')[1]}">${e(label)}</a>`).join('')}</nav>${home.footer.docs.map(([label,href])=>`<section id="${href.split('#')[1]}" class="document-section"><h2>${e(label)}</h2><p>Текст готовится</p></section>`).join('')}</div></section>`;
  }
  return {};
}
