// DOM-проверка без рендера. Не заменяет Chromium и проверку overflow.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname,'../..');
(async () => {
  const {parseHTML,DOMParser} = await import(pathToFileURL(path.join(os.tmpdir(),'povod-linkedom-0.18.12.mjs')));
  const artifact = process.argv.includes('--artifact');
  const sourceHTML = fs.readFileSync(path.join(root,'povod',artifact?'artifact.html':'index.html'),'utf8');
  const {window} = parseHTML(sourceHTML);
  const doc = window.document, events = {}, frames = [], missing = [], rendered = {};
  let now = 0, motionChange;
  let slotRect = {left:1316,top:858,right:1428,bottom:888,width:112,height:30};
  const location = {hash:'', href:'http://127.0.0.1:8770/povod/'};
  let stack = [{url:location.href,state:null}], cursor = 0;
  const history = {
    state:null, scrollRestoration:'auto',
    replaceState(s,_,url){this.state=s;stack[cursor]={url,state:s};location.href=url;location.hash=url.includes('#')?url.slice(url.indexOf('#')):''},
    pushState(s,_,url){const full=url.startsWith('#')?'http://127.0.0.1:8770/povod/'+url:url;this.state=s;stack=stack.slice(0,cursor+1);stack.push({url:full,state:s});cursor++;location.href=full;location.hash=full.slice(full.indexOf('#'))}
  };
  const Element = window.Element;
  // linkedom не реализует setter HTMLSelectElement.value.
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
    configurable:true,
    get(){return (this.querySelector('option[selected]') || this.querySelector('option'))?.textContent},
    set(v){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.textContent===v)}
  });
  Object.defineProperty(Element.prototype,'offsetHeight',{get(){return 900}});
  Object.defineProperty(Element.prototype,'offsetTop',{get(){return 0}});
  Element.prototype.scrollIntoView = function(){};
  Element.prototype.focus = function(){};
  Element.prototype.getBoundingClientRect = function(){return this._qaRect || (this.id==='slotsToggle' ? slotRect : {left:80,top:100,right:320,width:240,height:320,bottom:420})};
  Element.prototype.animate = function(){return {finished:Promise.resolve()}};
  Element.prototype.pause = function(){this.paused=true};
  Element.prototype.play = function(){this.paused=false;return Promise.resolve()};
  const dialog = doc.getElementById('giftDialog');
  dialog.open=false;dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;
  class Observer {
    constructor(fn){this.fn=fn}
    observe(target){this.fn([{target,isIntersecting:true}])}
    unobserve(){} disconnect(){}
  }
  const sandbox = {
    document:doc,location,history,console,performance:{now:()=>now},
    innerWidth:1440,innerHeight:900,scrollY:0,
    IntersectionObserver:Observer,DOMParser,
    matchMedia:()=>({matches:false,addEventListener:(_,f)=>motionChange=f}),
    requestAnimationFrame:f=>frames.push(f),
    scrollTo:(x,y)=>{sandbox.scrollY=typeof x==='object'?x.top:y},
    addEventListener:(name,fn)=>{(events[name] ||= []).push(fn)},
    fetch:async()=>({ok:true,text:async()=>fs.readdirSync(path.join(root,'povod/assets/v2/video')).map(f=>'<a href="'+f+'">'+f+'</a>').join('')})
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  if(artifact){
    for(const match of sourceHTML.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(match[1],context);
  }else{
    vm.runInContext(fs.readFileSync(path.join(root,'povod/data.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'povod/app.js'),'utf8'),context);
  }
  await new Promise(r=>setImmediate(r));
  const frame=t=>{now=t;assert.equal(frames.length,1,'one rAF callback');frames.shift()(t)};
  const click=el=>{assert.ok(el,'click target exists');el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}))};
  function mediaCheck(){
    const hint=doc.querySelector('.phone-hint');
    assert.ok(hint && !hint.closest('.phone,.phone-screen'),'phone hint is outside the screen');
    assert.ok(hint.previousElementSibling.classList.contains('phone'));
    for(const video of doc.querySelectorAll('video')){
      if(!/\/(slide-|story-)/.test(video.dataset.video))continue;
      assert.equal(video.getAttribute('preload'),'metadata');
      const poster='assets/v2/scenes/'+video.dataset.video.split('/').pop().replace('.mp4','.jpg');
      assert.equal(video.getAttribute('poster'),artifact?sandbox.POVOD_ASSETS[poster]:poster);
      assert.ok(video.src,'metadata source assigned even to inactive slides');
    }
    for(const img of doc.querySelectorAll('img')){
      const p=img.getAttribute('src');
      if(p && !p.startsWith('data:') && !fs.existsSync(path.join(root,'povod',p)))missing.push(p)
    }
  }
  assert.equal(doc.querySelectorAll('.hero-slide').length,4);
  assert.equal(doc.querySelectorAll('.occasion-card').length,5);
  frame(5300);assert.equal(doc.querySelector('.hero-slide.is-incoming').dataset.slide,'birthday');
  frame(6600);assert.equal(doc.querySelector('.hero-slide.is-active').dataset.slide,'birthday');
  click(doc.querySelector('[data-slide-button="3"]'));frame(8000);
  assert.equal(doc.querySelector('.hero-slide.is-active').dataset.slide,'jubilee');
  click(doc.querySelector('.hero-actions [data-scroll="request"]'));
  assert.equal(doc.querySelector('#occSelect option:checked')?.textContent || doc.querySelector('#occSelect').value,'Юбилей бабушки и дедушки');
  mediaCheck();
  sandbox.scrollY=530;
  click(doc.querySelector('[data-occasion="wedding"]'));
  assert.equal(location.hash,'#wedding');
  assert.equal(doc.querySelectorAll('.story-scene').length,4);
  assert.ok(doc.getElementById('scene-1').textContent.includes('Кофейня на Покровке'));
  assert.ok(doc.getElementById('scene-4').textContent.includes('собака Булка'));
  mediaCheck();
  // Имитация browser Back со state, сохранённым самим приложением.
  cursor--;history.state=stack[cursor].state;location.href=stack[cursor].url;location.hash='';
  for(const fn of events.popstate)fn();
  assert.equal(sandbox.scrollY,530);
  assert.ok(doc.querySelector('.hero'));
  for(const key of ['wedding','birthday','anniversary','jubilee']){
    click(doc.querySelector('[data-occasion="'+key+'"]'));
    assert.equal(location.hash,'#'+key);
    assert.equal(doc.querySelectorAll('.story-scene').length,4);
    mediaCheck();
    const types=[...doc.querySelectorAll('#giftPhone [data-block]')].map(n=>n.dataset.block);
    rendered[key]={scenes:4,blocks:types,slots:doc.querySelectorAll('[data-slot]').length};
    if(key==='birthday'){
      click(doc.querySelector('#giftPhone [data-answer="1"]'));
      assert.ok(doc.querySelector('#giftPhone .quiz-result').textContent.includes('Верно'));
    }
    if(key==='anniversary'){
      click(doc.querySelector('#giftPhone .g-reason'));
      assert.equal(doc.querySelectorAll('#giftPhone .g-reason.is-out').length,1);
    }
    if(key==='jubilee')assert.ok(types.includes('recipe'));
    click(doc.querySelector('[data-open-gift]'));assert.equal(dialog.open,true);
    click(doc.getElementById('closeFull'));assert.equal(dialog.open,false);
    doc.getElementById('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
    assert.ok(doc.getElementById('formNote').textContent.includes('не отправляется'));
    click(doc.querySelector('.occasion-hero a[href="#home"]'));
  }
  motionChange({matches:true});frame(100000);
  assert.equal(doc.querySelector('.hero-slide.is-active').dataset.slide,'wedding');
  assert.ok([...doc.querySelectorAll('video')].every(v=>v.paused));
  assert.equal(missing.length,0);
  const blocks=[...new Set(Object.values(rendered).flatMap(x=>x.blocks))];
  assert.equal(blocks.length,9);
  const collisionChecks=[];
  for(const [width,height] of [[1440,900],[375,812]]){
    sandbox.innerWidth=width;sandbox.innerHeight=height;
    slotRect={left:width-124,top:height-42,right:width-12,bottom:height-12,width:112,height:30};
    const cta=doc.querySelector('.hero-actions .btn');
    cta._qaRect={left:20,top:height-52,right:width-20,bottom:height-6,width:width-40,height:46};
    sandbox.scrollY++;frame(now+10);
    assert.ok(doc.getElementById('slotsToggle').classList.contains('is-occluded'));
    assert.equal(doc.getElementById('slotsToggle').tabIndex,-1);
    delete cta._qaRect;sandbox.scrollY++;frame(now+10);
    assert.ok(!doc.getElementById('slotsToggle').classList.contains('is-occluded'));
    click(doc.querySelector('[data-occasion="wedding"]'));
    const caption=doc.querySelector('.occasion-hero__bottom');
    caption._qaRect={left:20,top:height-90,right:width-20,bottom:height-58,width:width-40,height:32};
    sandbox.scrollY++;frame(now+10);
    assert.ok(!doc.getElementById('slotsToggle').classList.contains('is-occluded'));
    caption._qaRect={left:20,top:height-40,right:width-20,bottom:height-10,width:width-40,height:30};
    sandbox.scrollY++;frame(now+10);
    assert.ok(doc.getElementById('slotsToggle').classList.contains('is-occluded'));
    click(doc.querySelector('.occasion-hero a[href="#home"]'));
    collisionChecks.push({width,height,ctaHidden:true,captionHidden:true,clearPositionVisible:true});
  }
  click(doc.getElementById('slotsToggle'));assert.ok(doc.body.classList.contains('show-slots'));
  assert.equal(doc.getElementById('slotsToggle').getAttribute('aria-pressed'),'true');
  const result={artifact,domPassed:true,autoChange:true,thumbnailClick:true,routesAndBack:true,phoneBlocks:blocks,requestIsDemo:true,reducedMotion:true,phoneHintOutside:true,metadataAndPosters:true,collisionChecks,missingImages:missing,rendered,browserLayout:'not checked: Chromium spawn EPERM'};
  fs.writeFileSync(path.join(root,'codex/v2/povod_qa/',artifact?'dom_results_artifact.json':'dom_results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

