import {home} from '../content/home.js';
import {family} from '../content/family.js';
import {escapeHTML as e} from './core.js';

export const rootPath=document.body.dataset.root||'./';
export const siteURL=path=>rootPath+path.replace(/^\.\//,'');
export const assetMarkup=html=>html.replaceAll('./media/',siteURL('media/'));
export function mountShell(){
  const example=document.body.dataset.page.startsWith('example-');
  const links=[...(example?[['На главную','index.html']]:[]),['Примеры','index.html#examples'],['Цены','index.html#prices'],['Наши семьи','families.html'],['Заявка','index.html#request']];
  const current=document.body.dataset.page==='families'?'Наши семьи':'';
  const items=links.map(([label,href])=>`<a${label==='Заявка'?' class="nav-primary"':''}${label===current?' aria-current="page"':''} href="${siteURL(href)}">${label}</a>`).join('');
  document.querySelector('#site').insertAdjacentHTML('afterbegin',`<a class="skip-link" href="#main">К содержанию</a><nav class="navigation" aria-label="Главная навигация"><a class="wordmark" href="${siteURL('index.html')}">Летопись</a><div class="nav-links">${items}</div><button class="nav-toggle" type="button" aria-haspopup="dialog" aria-controls="mobile-menu" aria-expanded="false">Меню</button></nav><dialog class="mobile-menu" id="mobile-menu" aria-labelledby="mobile-menu-title" data-lenis-prevent><header class="mobile-menu-header"><p id="mobile-menu-title">Летопись</p><button class="menu-close" type="button">Закрыть</button></header><nav aria-label="Разделы сайта">${items}</nav></dialog>`);
  document.querySelector('.site-footer').innerHTML=`<p>${e(home.footer.note)}</p><nav aria-label="Документы">${home.footer.docs.map(([label,url])=>`<a href="${siteURL(url)}">${e(label)}</a>`).join('')}</nav>`;
}
export function tariffBlock(id){
  const index=home.examples.items.findIndex(item=>item.id===id),tariff=home.prices.tariffs[index];
  return `<section class="tariff-block paper-section" id="example-tariff"><div class="home-wrap"><p class="eyebrow">${e(tariff.name)}</p><h2>Это пример формата «${e(tariff.name)}»</h2><div class="tariff-details"><ul>${tariff.items.map(item=>`<li>${e(item)}</li>`).join('')}</ul><div><p class="tariff-price">${e(tariff.price)}</p><p>${e(tariff.time)}</p><div class="home-actions"><a class="home-button primary" href="${siteURL(`index.html?tariff=${id}#request`)}">Хочу так же</a><a class="home-button" href="${siteURL('index.html#examples')}">Другие примеры</a></div></div></div></div></section>`;
}
export function exampleCards({compact=false}={}){
  const items=compact?[...home.examples.items.map(item=>item.id==='family'?{...item,years:`${family.generations.length} поколений`}:item),...['maria','sergey'].map(id=>{const person=family.people[id];return {id,href:`examples/${id}.html`,tariff:home.prices.tariffs[1].name,person:person.name,years:person.years,image:`media/${person.photo}`};})]:home.examples.items;
  return `<div class="${compact?'family-grid':'example-grid'}">${items.map(item=>`<a class="${compact?'family-card':'example-card'}" href="${siteURL(item.href)}"><img src="${siteURL(item.image)}" alt="${e(item.person)}" width="1600" height="2000" loading="lazy" data-slot="Обложка примера ${e(item.tariff)}"><div class="example-card-content"><p class="example-tag">${compact?'Пример · ':''}${e(item.tariff)}${compact?'':`<span>${e(item.price)}</span>`}</p><h3>${e(item.person)}</h3><p class="example-years">${e(item.years)}</p>${compact?'':`<div class="example-disclosure"><p>${e(item.text)}</p><span class="home-button">Смотреть пример</span></div>`}</div></a>`).join('')}</div>`;
}
