import {home} from '../content/home.js';
import {family} from '../content/family.js';
import {escapeHTML as e} from '../lib/core.js';
import {siteURL} from '../lib/shell.js';

// Keep the catalogue connected to the approved examples and family biographies.
const firstSentence=text=>text.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0].trim()||text;
const filters=[['all','Все'],...home.examples.items.map(({id,tariff})=>[id,tariff])];

export function mountFamilies(){
  const items=[
    ...home.examples.items.map(item=>({...item,summary:firstSentence(item.text)})),
    ...['maria','sergey'].map(id=>{
      const person=family.people[id];
      return {id,format:'life',href:`examples/${id}.html`,tariff:home.prices.tariffs[1].name,
        person:person.name,years:person.years,image:`media/${person.photo}`,summary:firstSentence(person.bio[0])};
    })
  ];
  const main=document.querySelector('main');
  main.innerHTML=`<section class="families-page" data-theme="paper" aria-labelledby="families-title">
    <div class="families-wrap">
      <header class="families-heading">
        <p class="families-kicker">${e(home.families.kicker)}</p>
        <h1 id="families-title">${e(home.families.title)}</h1>
        <p class="families-intro">${e(home.families.note)}</p>
      </header>
      <div class="families-filters" role="group" aria-label="Фильтр по тарифу">
        ${filters.map(([id,label])=>`<button type="button" data-family-filter="${id}" aria-pressed="${id==='all'}" aria-controls="families-catalogue">${e(label)}</button>`).join('')}
      </div>
      <div class="families-catalogue" id="families-catalogue">
        ${items.map((item,index)=>`<article class="families-entry" data-family-format="${item.format||item.id}">
          <a class="families-card" href="${siteURL(item.href)}" aria-labelledby="family-name-${item.id}">
            <img src="${siteURL(item.image)}" alt="${e(item.person)}" width="1600" height="2000" loading="${index<3?'eager':'lazy'}" decoding="async" data-slot="Обложка примера ${e(item.tariff)}">
            <div class="families-card-top"><p class="families-tariff">${e(item.tariff)}</p><span class="families-example">пример</span></div>
            <div class="families-card-copy">
              <h2 id="family-name-${item.id}">${e(item.person)}</h2>
              <p class="families-years">${e(item.years)}</p>
              <p class="families-summary" title="${e(item.summary)}">${e(item.summary)}</p>
              <span class="families-open" aria-hidden="true">Открыть страницу</span>
            </div>
          </a>
        </article>`).join('')}
      </div>
      <footer class="families-publication"><a href="${siteURL('docs.html#publication')}">Страница появляется здесь только с согласия семьи</a></footer>
    </div>
  </section>`;
  const buttons=[...main.querySelectorAll('[data-family-filter]')];
  const cards=[...main.querySelectorAll('[data-family-format]')];
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.familyFilter;
    buttons.forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
    cards.forEach(card=>{card.hidden=selected!=='all'&&card.dataset.familyFormat!==selected;});
  }));
  return {};
}
