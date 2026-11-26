import '../life.css';
import {escapeHTML as e} from '../lib/core.js';
import {siteURL} from '../lib/shell.js';

export const petrArchive={
  objects:[
    ['medal.png','Медаль «За отвагу», вручена семье в 1946 году'],
    ['letter.png','Одно из 37 писем, май 1943'],
    ['pilotka.png','Солдатская пилотка, хранилась у Марии'],
    ['warphoto.png','Пётр, лето 1941']
  ],
  voice:'Николай Петрович вспоминает отца, запись 2016 года, 0:42',
  transcript:'Отец присел передо мной на станции и сказал: теперь ты, Коля, в доме за старшего. Я потом всю войну так и думал, что он вернётся проверить',
  place:'Братская могила № 3, Прохоровка, Белгородская область. Пётр Соколов в списке на третьей плите'
};

function map(){return `<svg class="life-map" viewBox="0 0 600 400" role="img" aria-labelledby="life-map-title life-map-description">
  <title id="life-map-title">Район Прохоровки</title><desc id="life-map-description">Условная схема с отметкой братской могилы. Пример, данные вымышлены.</desc>
  <rect width="600" height="400" fill="#e5dfca"/>
  <path d="M0 0H235L192 91 73 135 0 117ZM600 0H417L390 99 479 143 600 110ZM0 290L147 260 198 328 178 400H0ZM600 252L441 283 415 400H600Z" fill="#c5cbb07d"/>
  <path d="M-20 172Q70 104 125 164T254 215Q304 217 327 308T440 420" fill="none" stroke="#b1c4bc" stroke-width="20"/>
  <path d="M-20 172Q70 104 125 164T254 215Q304 217 327 308T440 420" fill="none" stroke="#d8e1d5" stroke-width="8"/>
  <path d="M-20 344L179 202 330 151 635 48M185 -20L282 135 337 218 575 428" fill="none" stroke="#f8f1e2" stroke-width="13"/>
  <path d="M-20 344L179 202 330 151 635 48M185 -20L282 135 337 218 575 428" fill="none" stroke="#b4a78e" stroke-width="1.5"/>
  <path d="M266 148L393 126 466 183 436 262 341 282 289 233Z" fill="#c8b89c55" stroke="#ac9c8266"/>
  <path d="M277 163L416 226M305 145L345 257M374 135L394 264" fill="none" stroke="#f8f1e2" stroke-width="4"/>
  <path d="M70 40L104 93M62 48L96 101M520 312L558 358M512 320L550 366" stroke="#9ca98666" stroke-width="2"/>
  <text x="32" y="46" fill="#66705b" font-size="13" letter-spacing="2">БЕЛГОРОДСКАЯ ОБЛАСТЬ</text>
  <text x="292" y="107" fill="#574b3c" font-size="27">Прохоровка</text>
  <text x="113" y="238" fill="#667b73" font-size="18" font-style="italic">Псёл</text>
  <path d="M367 173V201M356 182H378" fill="none" stroke="#8e492f" stroke-width="4"/>
  <path d="M372 198L396 302" fill="none" stroke="#8e492f" stroke-width="1.4"/>
  <rect x="266" y="302" width="290" height="57" rx="1" fill="#f6efdf" stroke="#b7a58a"/>
  <text x="282" y="337" fill="#784830" font-size="20">Братская могила № 3</text>
</svg>`;}

export function mountLifeArchive(){
  const before=document.querySelector('#candle');
  before.insertAdjacentHTML('beforebegin',`<div class="life-archive" id="family-archive">
    <section class="life-archive-section life-objects" id="life-objects" data-theme="paper" aria-labelledby="life-objects-title">
      <div class="life-archive-wrap"><header class="life-archive-heading"><span class="life-margin-number" aria-hidden="true">I</span><h2 id="life-objects-title">Награды и документы</h2><p>Нажмите на предмет, чтобы рассмотреть</p></header>
      <div class="life-object-table">${petrArchive.objects.map(([file,caption],index)=>`<figure class="life-object life-object-${index}"><button class="life-object-open" type="button" data-life-object="${index}" aria-haspopup="dialog" aria-controls="life-lightbox" aria-label="Рассмотреть: ${e(caption)}"><img src="${siteURL('media/'+file)}" alt="${e(caption)}" width="${index===0?439:index===3?675:900}" height="${index===0||index===3?900:index===1?490:641}" loading="lazy" data-slot="${e(caption)}"></button><figcaption>${e(caption)}</figcaption></figure>`).join('')}</div></div>
    </section>
    <section class="life-archive-section life-voice" id="life-voice" data-theme="paper" aria-labelledby="life-voice-title"><div class="life-archive-wrap life-voice-layout">
      <header class="life-archive-heading"><span class="life-margin-number" aria-hidden="true">II</span><h2 id="life-voice-title">Голос семьи</h2></header>
      <div class="life-voice-recording"><p class="life-recording-caption">${e(petrArchive.voice)}</p><svg class="life-wave" viewBox="0 0 600 80" aria-hidden="true">${Array.from({length:90},(_,i)=>{const h=5+Math.abs(Math.sin(i*.39)*Math.sin(i*.83)+.3*Math.sin(i*.17))*52;return `<path d="M${i*6.7+2} ${(80-h)/2}v${h.toFixed(2)}"/>`;}).join('')}</svg><button type="button" class="life-archive-button" id="life-play" aria-describedby="life-voice-status">Слушать запись</button><p id="life-voice-status" class="life-voice-status sr-only" role="status"></p><blockquote class="life-transcript">${e(petrArchive.transcript)}</blockquote></div>
    </div></section>
    <section class="life-archive-section life-memory" id="life-memory" data-theme="paper" aria-labelledby="life-memory-title"><div class="life-archive-wrap">
      <header class="life-archive-heading"><span class="life-margin-number" aria-hidden="true">III</span><h2 id="life-memory-title">Место памяти</h2></header>
      <div class="life-memory-layout"><figure class="life-map-print" data-slot="Условная карта места памяти">${map()}</figure><div class="life-memory-copy"><p>${e(petrArchive.place)}</p><button class="life-archive-button" type="button" disabled aria-describedby="life-route-note" title="В макете маршрут не строится">Построить маршрут</button><p class="life-route-note" id="life-route-note">В макете маршрут не строится</p></div></div>
      <p class="life-fiction">Пример. Данные вымышлены</p>
    </div></section>
  </div>`);
  document.querySelector('#site').insertAdjacentHTML('beforeend',`<dialog id="life-lightbox" class="life-lightbox" aria-labelledby="life-lightbox-caption" data-lenis-prevent><button type="button" class="life-lightbox-close" autofocus>Закрыть</button><figure><img alt=""><figcaption id="life-lightbox-caption"></figcaption></figure></dialog>`);
  const dialog=document.querySelector('#life-lightbox'),close=dialog.querySelector('button'),image=dialog.querySelector('img'),caption=dialog.querySelector('figcaption');let previous;
  document.querySelectorAll('[data-life-object]').forEach(button=>button.addEventListener('click',()=>{
    const [file,text]=petrArchive.objects[Number(button.dataset.lifeObject)];previous=button;image.src=siteURL('media/'+file);image.alt=text;caption.textContent=text;dialog.showModal();window.__lenis?.stop();close.focus({preventScroll:true});
  }));
  function finish(){if(dialog.open)dialog.close();}
  close.addEventListener('click',finish);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
  dialog.addEventListener('close',()=>{window.__lenis?.start();previous?.focus({preventScroll:true});previous=null;});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();close.focus({preventScroll:true});}});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)finish();});
  const play=document.querySelector('#life-play');play.addEventListener('click',()=>{const text='В макете запись не воспроизводится';play.textContent=text;document.querySelector('#life-voice-status').textContent=text;});
}
